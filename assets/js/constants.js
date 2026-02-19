export const FS = 8000; // suggested standard audio fs
export const F0 = 128;
export const F1 = F0; // 128
export const F2 = F0 / 2; // 64
export const F3 = 10 * F0; // 1280

export const LOWS = [697, 770, 852, 941];
export const HIGHS = [1209, 1336, 1477, 1633];

const DTMF_LAYOUT = [
  ["1", "2", "3", "a"],
  ["4", "5", "6", "b"],
  ["7", "8", "9", "c"],
  ["*", "0", "#", "d"]
];

export const PAD_KEYS = DTMF_LAYOUT.flat();

export const DTMF = Object.fromEntries(
  DTMF_LAYOUT.flatMap((row, rowIndex) =>
    row.map((key, colIndex) => [key, [LOWS[rowIndex], HIGHS[colIndex]]])
  )
);
