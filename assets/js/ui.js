import { DTMF, PAD_KEYS, FS } from "./constants.js";
import { plotSignal, plotSpectrum } from "./plotting.js";
import { ensureAudio, generateDtmfSamples, playSamples } from "./audio.js";
import { spectrum } from "./fft.js";

export function setupUi() {
  const durEl = document.getElementById("dur");
  const volEl = document.getElementById("vol");
  const durLabel = document.getElementById("durLabel");
  const volLabel = document.getElementById("volLabel");
  const lastKeyEl = document.getElementById("lastKey");
  const lastFreqEl = document.getElementById("lastFreq");
  const errEl = document.getElementById("err");
  const timeInfoEl = document.getElementById("timeInfo");
  const fftInfoEl = document.getElementById("fftInfo");
  const padEl = document.getElementById("pad");
  let audioUnlocked = false;

  durEl.addEventListener("input", () => {
    durLabel.textContent = `${Number(durEl.value).toFixed(2)} s`;
  });
  volEl.addEventListener("input", () => {
    volLabel.textContent = `${(Number(volEl.value)*100).toFixed(2)}%`;
  });

  function buildPad() {
    padEl.innerHTML = "";
    for (const key of PAD_KEYS) {
      const button = document.createElement("button");
      button.className = "key mono";
      button.textContent = key.toUpperCase();
      button.addEventListener("click", () => onKey(key));
      padEl.appendChild(button);
    }
  }

  async function unlockAudioOnce() {
    if (audioUnlocked) return;
    try {
      await ensureAudio();
      audioUnlocked = true;
    } catch {
      // Keep UI responsive; playback path will surface any real error to the user.
    }
  }

  function attachAudioUnlockListeners() {
    const opts = { once: true, passive: true };
    window.addEventListener("pointerdown", unlockAudioOnce, opts);
    window.addEventListener("touchstart", unlockAudioOnce, opts);
    window.addEventListener("click", unlockAudioOnce, opts);
  }

  async function onKey(key) {
    errEl.textContent = "";
    unlockAudioOnce();
    const freqs = DTMF[key];
    if (!freqs) return;

    const [flo, fhi] = freqs;
    const duration = Number(durEl.value);
    const volume = Number(volEl.value);

    lastKeyEl.textContent = `last key: ${key.toUpperCase()}`;
    lastFreqEl.textContent = `freqs: ${flo} Hz + ${fhi} Hz`;

    try {
      const samples = generateDtmfSamples(flo, fhi, duration);

      await playSamples(samples, volume);

      timeInfoEl.textContent = `n = ${samples.length} (fs=${FS})`;
      plotSignal(
        document.getElementById("c_time"),
        samples,
        `dtmf "${key.toUpperCase()}" - time`,
        "samples",
        "amplitude"
      );

      const { mags, freqs: fftFreqs, nfft } = spectrum(samples);
      fftInfoEl.textContent = `nfft = ${nfft}`;
      plotSpectrum(
        document.getElementById("c_fft"),
        mags,
        fftFreqs,
        `dtmf "${key.toUpperCase()}" - magnitude spectrum`
      );
    } catch (error) {
      errEl.textContent = `audio error: ${error?.message || String(error)}`;
    }
  }

  buildPad();
  attachAudioUnlockListeners();
}
