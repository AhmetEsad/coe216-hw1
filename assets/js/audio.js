import { FS } from "./constants.js";

let audioCtx = null;

export async function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: FS });
  }
  if (audioCtx.state === "suspended") await audioCtx.resume();
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
  const ctx = await ensureAudio();
  const buf = ctx.createBuffer(1, samples.length, FS);
  buf.copyToChannel(samples, 0);

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  src.connect(gain).connect(ctx.destination);
  src.start();
  return { ctx, src };
}
