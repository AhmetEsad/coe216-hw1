import { FS as FS_DTMF, F1, F2, F3 } from "./constants.js";
import { plotSignal, plotSignalOverlay } from "./plotting.js";

const T_END = 0.05;
const FS_REF = FS_DTMF;
const NYQUIST_THRESHOLD = 2 * F3;
const TASK1_FS_DEFAULT = NYQUIST_THRESHOLD + 1;
const MAX_ANIM_FPS = 60;
const MIN_FRAME_MS = 1000 / MAX_ANIM_FPS;
const ANIM_TIME_SCALE = 0.001;

const task1State = {
  initialized: false,
  els: null,
  animEnabled: true,
  sampleRateHz: TASK1_FS_DEFAULT,
  phaseTimeSec: 0,
  rafId: null,
  lastFrameMs: null,
  buffers: null,
  bufferSampleRateHz: 0
};

function samplesForDuration(durationSec, sampleRateHz) {
  return Math.max(16, Math.floor(sampleRateHz * durationSec));
}

function ensureTask1Buffers() {
  const sampleRateHz = task1State.sampleRateHz;
  if (task1State.buffers && task1State.bufferSampleRateHz === sampleRateHz) {
    return task1State.buffers;
  }

  const t1 = 3 / F1;
  const t2 = 3 / F2;
  const t3 = 3 / F3;

  task1State.buffers = {
    t1,
    t2,
    t3,
    x1: new Float32Array(samplesForDuration(t1, sampleRateHz)),
    x2: new Float32Array(samplesForDuration(t2, sampleRateHz)),
    x3: new Float32Array(samplesForDuration(t3, sampleRateHz)),
    x3DenseRef: new Float32Array(2000),
    sum: new Float32Array(samplesForDuration(T_END, sampleRateHz)),
    sumOverlayRef: new Float32Array(Math.max(2, Math.floor(FS_REF * T_END)))
  };
  task1State.bufferSampleRateHz = sampleRateHz;
  return task1State.buffers;
}

function fillSineSamples(samples, frequency, sampleRateHz, phaseTimeSec) {
  const omega = 2 * Math.PI * frequency;
  const phaseOffset = omega * phaseTimeSec;
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRateHz;
    samples[i] = Math.sin(omega * t + phaseOffset);
  }
}

function fillDenseSine(samples, frequency, tEnd, phaseTimeSec) {
  const omega = 2 * Math.PI * frequency;
  const phaseOffset = omega * phaseTimeSec;
  const denom = Math.max(1, samples.length - 1);
  for (let i = 0; i < samples.length; i++) {
    const t = (i / denom) * tEnd;
    samples[i] = Math.sin(omega * t + phaseOffset);
  }
}

function fillSum(samples, sampleRateHz, phaseTimeSec) {
  const omega1 = 2 * Math.PI * F1;
  const omega2 = 2 * Math.PI * F2;
  const omega3 = 2 * Math.PI * F3;
  const p1 = omega1 * phaseTimeSec;
  const p2 = omega2 * phaseTimeSec;
  const p3 = omega3 * phaseTimeSec;

  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRateHz;
    samples[i] = Math.sin(omega1 * t + p1) + Math.sin(omega2 * t + p2) + Math.sin(omega3 * t + p3);
    samples[i] *= 0.33;
  }
}

function getTask1Els() {
  if (task1State.els) return task1State.els;

  const els = {
    animPhase: document.getElementById("animPhase"),
    fsTask1: document.getElementById("fsTask1"),
    fsTask1Label: document.getElementById("fsTask1Label")
  };

  const hasAll = Object.values(els).every(Boolean);
  if (!hasAll) return null;

  task1State.els = els;
  return els;
}

function setTask1SampleRate(nextRate) {
  const safe = nextRate; // Math.min(8000, Math.max(400, Math.round(nextRate)));
  const changed = safe !== task1State.sampleRateHz;
  task1State.sampleRateHz = safe;
  if (changed) {
    task1State.buffers = null;
    task1State.bufferSampleRateHz = 0;
  }
  return changed;
}

function updateTask1RateLabels() {
  const els = getTask1Els();
  if (!els) return;
  els.fsTask1Label.textContent = `${task1State.sampleRateHz} Hz`;
}

function renderTask1Core(phaseTimeSec) {
  const buffers = ensureTask1Buffers();
  const sampleRateHz = task1State.sampleRateHz;
  const sharedTimeSec = phaseTimeSec;

  // f1, f2, f3, and sum all use the same animation time base.
  fillSineSamples(buffers.x1, F1, sampleRateHz, sharedTimeSec);
  fillSineSamples(buffers.x2, F2, sampleRateHz, sharedTimeSec);
  fillSineSamples(buffers.x3, F3, sampleRateHz, sharedTimeSec);
  fillDenseSine(buffers.x3DenseRef, F3, buffers.t3, sharedTimeSec);
  fillSum(buffers.sum, sampleRateHz, sharedTimeSec);
  fillSum(buffers.sumOverlayRef, FS_REF, sharedTimeSec);

  plotSignal(
    document.getElementById("c_f1"),
    buffers.x1,
    `f1 = ${F1} Hz (3 periods)`,
    "samples",
    "amplitude",
    { periodMarkers: 3 }
  );
  plotSignal(
    document.getElementById("c_f2"),
    buffers.x2,
    `f2 = ${F2} Hz (3 periods)`,
    "samples",
    "amplitude",
    { periodMarkers: 3 }
  );
  plotSignalOverlay(
    document.getElementById("c_f3"),
    buffers.x3DenseRef,
    buffers.x3,
    `f3 = ${F3} Hz (3 periods)`,
    "samples",
    "amplitude",
    { periodMarkers: 3 }
  );
  plotSignalOverlay(
    document.getElementById("c_sum"),
    buffers.sumOverlayRef,
    buffers.sum,
    `sum: f1 + f2 + f3 (window = ${T_END}s)`,
    "samples",
    "amplitude",
    { periodMarkers: 3 }
  );
}

function stopTask1Animation() {
  if (task1State.rafId !== null) {
    cancelAnimationFrame(task1State.rafId);
    task1State.rafId = null;
  }
  task1State.lastFrameMs = null;
}

function animateTask1Frame(nowMs) {
  if (!task1State.animEnabled) {
    task1State.rafId = null;
    task1State.lastFrameMs = null;
    return;
  }

  if (task1State.lastFrameMs === null) {
    task1State.lastFrameMs = nowMs;
  }

  const elapsedMs = nowMs - task1State.lastFrameMs;
  if (elapsedMs >= MIN_FRAME_MS) {
    const clampedMs = Math.min(elapsedMs, 100);
    task1State.phaseTimeSec += (clampedMs / 1000) * ANIM_TIME_SCALE;

    // Animation is only a visual phase shift; the underlying signals are unchanged.
    renderTask1Core(task1State.phaseTimeSec);

    task1State.lastFrameMs = nowMs - (elapsedMs % MIN_FRAME_MS);
  }

  task1State.rafId = requestAnimationFrame(animateTask1Frame);
}

function startTask1Animation() {
  if (task1State.rafId !== null) return;
  task1State.lastFrameMs = null;
  task1State.rafId = requestAnimationFrame(animateTask1Frame);
}

function applyAnimationState(enabled) {
  task1State.animEnabled = enabled;
  if (enabled) {
    startTask1Animation();
  } else {
    stopTask1Animation();
    task1State.phaseTimeSec = 0;
    renderTask1Core(0);
  }
}

function rerenderAfterControlsChange() {
  if (task1State.animEnabled) {
    renderTask1Core(task1State.phaseTimeSec);
  } else {
    renderTask1Core(0);
  }
}

export function genSine(frequency, tEnd) {
  const n = samplesForDuration(tEnd, task1State.sampleRateHz);
  const out = new Float32Array(n);
  fillSineSamples(out, frequency, task1State.sampleRateHz, 0);
  return out;
}

export function setupTask1() {
  const els = getTask1Els();
  if (!els || task1State.initialized) return;

  setTask1SampleRate(Number(els.fsTask1.value) || TASK1_FS_DEFAULT);
  els.fsTask1.value = String(task1State.sampleRateHz);

  els.fsTask1.addEventListener("input", () => {
    setTask1SampleRate(Number(els.fsTask1.value));
    updateTask1RateLabels();
    rerenderAfterControlsChange();
  });
  els.fsTask1Label.addEventListener("click", () => {
    els.fsTask1.value = String(NYQUIST_THRESHOLD);
    setTask1SampleRate(NYQUIST_THRESHOLD);
    updateTask1RateLabels();
    rerenderAfterControlsChange();
  });
  els.animPhase.addEventListener("change", () => {
    applyAnimationState(els.animPhase.checked);
  });

  task1State.animEnabled = els.animPhase.checked;
  task1State.initialized = true;
  updateTask1RateLabels();
}

export function renderTask1() {
  if (task1State.animEnabled) {
    renderTask1Core(task1State.phaseTimeSec);
    startTask1Animation();
  } else {
    renderTask1Core(0);
  }
}
