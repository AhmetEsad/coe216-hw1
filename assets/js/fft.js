import { FS } from "./constants.js";

function nextPow2(n) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function bitReversePermutation(re, im) {
  const n = re.length;
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
    let m = n >> 1;
    while (m >= 1 && j >= m) {
      j -= m;
      m >>= 1;
    }
    j += m;
  }
}

function fftRadix2(re, im) {
  const n = re.length;
  bitReversePermutation(re, im);

  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);

    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let j = 0; j < len / 2; j++) {
        const uRe = re[i + j];
        const uIm = im[i + j];
        const vRe = re[i + j + len / 2] * wRe - im[i + j + len / 2] * wIm;
        const vIm = re[i + j + len / 2] * wIm + im[i + j + len / 2] * wRe;

        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + len / 2] = uRe - vRe;
        im[i + j + len / 2] = uIm - vIm;

        const nwRe = wRe * wlenRe - wIm * wlenIm;
        const nwIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nwRe;
        wIm = nwIm;
      }
    }
  }
}

export function spectrum(samples) {
  const nfft = nextPow2(samples.length);
  const re = new Float32Array(nfft);
  const im = new Float32Array(nfft);

  const n = samples.length;
  for (let i = 0; i < n; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    re[i] = samples[i] * w;
  }

  fftRadix2(re, im);

  const half = nfft >> 1;
  const mags = new Float32Array(half);
  const freqs = new Float32Array(half);
  for (let k = 0; k < half; k++) {
    mags[k] = Math.hypot(re[k], im[k]);
    freqs[k] = (k * FS) / nfft;
  }
  return { mags, freqs, nfft };
}
