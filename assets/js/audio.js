import { FS } from "./constants.js";

let audioCtx = null;
let hasPrimedAudio = false;
const activePlaybacks = new Set();
const activeHtmlAudio = new Set();

function createAudioContext() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error("web audio api is not supported in this browser");
  }
  // iOS Safari/Chrome are more reliable with the default hardware sample rate.
  return new AudioContextCtor();
}

function primeAudioContext(ctx) {
  if (hasPrimedAudio) return;
  const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = silent;
  src.connect(ctx.destination);
  src.start(0);
  hasPrimedAudio = true;
}

function resampleLinear(samples, inRate, outRate) {
  if (inRate === outRate) return samples;

  const outLength = Math.max(1, Math.round(samples.length * (outRate / inRate)));
  const out = new Float32Array(outLength);
  const inLast = Math.max(0, samples.length - 1);
  const outLast = Math.max(1, outLength - 1);

  for (let i = 0; i < outLength; i++) {
    const pos = (i / outLast) * inLast;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = samples[idx];
    const b = samples[Math.min(inLast, idx + 1)];
    out[i] = a + (b - a) * frac;
  }
  return out;
}

function isIOSDevice() {
  const ua = navigator.userAgent || "";
  const isTouchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || isTouchMac;
}

function encodeWav16Mono(samples, sampleRate) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  let offset = 0;
  const writeAscii = (text) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset++, text.charCodeAt(i));
    }
  };

  writeAscii("RIFF");
  view.setUint32(offset, 36 + dataSize, true); offset += 4;
  writeAscii("WAVE");
  writeAscii("fmt ");
  view.setUint32(offset, 16, true); offset += 4; // PCM chunk size
  view.setUint16(offset, 1, true); offset += 2; // PCM format
  view.setUint16(offset, 1, true); offset += 2; // mono
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * bytesPerSample, true); offset += 4;
  view.setUint16(offset, bytesPerSample, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2;
  writeAscii("data");
  view.setUint32(offset, dataSize, true); offset += 4;

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const v = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, v, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

async function playSamplesWithHtmlAudio(samples, volume) {
  const safeVolume = Math.max(0, Math.min(1, volume));
  const scaled = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    scaled[i] = samples[i] * safeVolume;
  }

  const blob = encodeWav16Mono(scaled, FS);
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  const ref = { audio, url };
  activeHtmlAudio.add(ref);

  audio.preload = "auto";
  audio.playsInline = true;
  audio.volume = 1;

  const cleanup = () => {
    if (!activeHtmlAudio.has(ref)) return;
    activeHtmlAudio.delete(ref);
    URL.revokeObjectURL(url);
    audio.onended = null;
    audio.onerror = null;
  };
  audio.onended = cleanup;
  audio.onerror = cleanup;

  try {
    await audio.play();
  } catch (error) {
    cleanup();
    throw error;
  }
  return { audio };
}

export async function ensureAudio() {
  if (!audioCtx) {
    audioCtx = createAudioContext();
  }
  if (audioCtx.state !== "running") {
    await audioCtx.resume();
  }
  if (audioCtx.state !== "running") {
    throw new Error("audio context is not running (user gesture required)");
  }
  primeAudioContext(audioCtx);
  return audioCtx;
}

export function generateDtmfSamples(flo, fhi, durationSec) {
  const n = Math.max(16, Math.floor(FS * durationSec));
  const x = new Float32Array(n);
  const fadeN = Math.min(Math.floor(0.01 * FS), Math.floor(n / 4)); // 10ms or less

  for (let i = 0; i < n; i++) {
    const t = i / FS;
    let v = Math.sin(2 * Math.PI * flo * t) + Math.sin(2 * Math.PI * fhi * t);
    v *= 0.5;

    let env = 1;
    if (i < fadeN) env = i / fadeN;
    else if (i > n - fadeN) env = (n - i) / fadeN;

    x[i] = v * env;
  }
  return x;
}

export async function playSamples(samples, volume) {
  if (isIOSDevice()) {
    try {
      return await playSamplesWithHtmlAudio(samples, volume);
    } catch {
      // Fall through to Web Audio path.
    }
  }

  const ctx = await ensureAudio();
  const playbackSamples = resampleLinear(samples, FS, ctx.sampleRate);
  const buf = ctx.createBuffer(1, playbackSamples.length, ctx.sampleRate);
  buf.copyToChannel(playbackSamples, 0);

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);

  src.connect(gain).connect(ctx.destination);
  const playbackRef = { src, gain };
  activePlaybacks.add(playbackRef);
  src.onended = () => {
    src.disconnect();
    gain.disconnect();
    activePlaybacks.delete(playbackRef);
  };
  src.start();
  return { ctx, src };
}
