const COLOR_BG_START = "#fcfeff";
const COLOR_BG_END = "#eaf2ff";
const COLOR_AXIS = "rgba(24,50,90,0.35)";
const COLOR_LABEL = "rgba(24,50,90,0.92)";
const COLOR_GRID = "rgba(24,50,90,0.12)";
const COLOR_SIGNAL = "rgba(40,102,188,0.95)";
const COLOR_POINTS = "rgba(205,122,44,0.95)";
const COLOR_POINTS_LINE = "rgba(205,122,44,0.72)";
const COLOR_SPECTRUM = "rgba(173,96,28,0.95)";

export function fitCanvas(canvas) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  return { w: canvas.width, h: canvas.height };
}

export function clear(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, COLOR_BG_START);
  gradient.addColorStop(1, COLOR_BG_END);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

export function drawAxes(ctx, w, h, pad = 28) {
  ctx.strokeStyle = COLOR_AXIS;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.stroke();
  return { pad };
}

export function drawLabel(ctx, text, x, y) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  ctx.fillStyle = COLOR_LABEL;
  ctx.font = `${Math.floor(12 * dpr)}px ui-monospace, sfmono-regular, menlo, monospace`;
  ctx.fillText(text, x, y);
}

function drawPeriodMarkers(ctx, w, h, pad, periodCount) {
  if (!Number.isFinite(periodCount) || periodCount <= 0) return;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const baseY = h - pad;
  const tickLen = 4 * dpr;
  const labelY = Math.min(h - 2 * dpr, baseY + tickLen + 10 * dpr);

  ctx.strokeStyle = COLOR_AXIS;
  ctx.fillStyle = COLOR_LABEL;
  ctx.lineWidth = 1;
  ctx.font = `${Math.floor(10 * dpr)}px ui-monospace, sfmono-regular, menlo, monospace`;

  for (let k = 0; k <= periodCount; k++) {
    const x = pad + (k / periodCount) * (w - 2 * pad);
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, baseY + tickLen);
    ctx.stroke();

    const label = String(k);
    const labelWidth = ctx.measureText(label).width;
    ctx.fillText(label, x - labelWidth / 2, labelY);
  }
}

function xAxisLabelY(h, hasPeriodMarkers) {
  return hasPeriodMarkers ? h - 30 : h - 14;
}

function yAxisLabelY(pad) {
  return pad + 10;
}

export function plotSignal(canvas, samples, title, xLabel, yLabel, options = {}) {
  const { w, h } = fitCanvas(canvas);
  const ctx = canvas.getContext("2d");
  clear(ctx, w, h);

  const { pad } = drawAxes(ctx, w, h, 34);

  let ymin = Infinity;
  let ymax = -Infinity;
  for (const v of samples) {
    if (v < ymin) ymin = v;
    if (v > ymax) ymax = v;
  }
  if (!isFinite(ymin) || !isFinite(ymax) || ymin === ymax) {
    ymin = -1;
    ymax = 1;
  }

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const n = samples.length;
  ctx.strokeStyle = COLOR_SIGNAL;
  ctx.lineWidth = Math.max(1, dpr);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = pad + (i / (n - 1)) * (w - 2 * pad);
    const y = h - pad - ((samples[i] - ymin) / (ymax - ymin)) * (h - 2 * pad);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const periodMarkers = options.periodMarkers ?? 0;
  const hasPeriodMarkers = Number.isFinite(periodMarkers) && periodMarkers > 0;
  const xLabelY = xAxisLabelY(h, hasPeriodMarkers);

  drawLabel(ctx, title, pad, pad - 10);
  drawLabel(ctx, xLabel, w - pad - ctx.measureText(xLabel).width, xLabelY);
  drawLabel(ctx, yLabel, 8, yAxisLabelY(pad));
  if (hasPeriodMarkers) {
    drawPeriodMarkers(ctx, w, h, pad, periodMarkers);
  }

  ctx.strokeStyle = COLOR_GRID;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 1; k <= 3; k++) {
    const yy = pad + (k / 4) * (h - 2 * pad);
    ctx.moveTo(pad, yy);
    ctx.lineTo(w - pad, yy);
  }
  ctx.stroke();
}

export function plotSignalPoints(canvas, samples, title, xLabel, yLabel, options = {}) {
  const { w, h } = fitCanvas(canvas);
  const ctx = canvas.getContext("2d");
  clear(ctx, w, h);

  const { pad } = drawAxes(ctx, w, h, 34);

  let ymin = Infinity;
  let ymax = -Infinity;
  for (const v of samples) {
    if (v < ymin) ymin = v;
    if (v > ymax) ymax = v;
  }
  if (!isFinite(ymin) || !isFinite(ymax) || ymin === ymax) {
    ymin = -1;
    ymax = 1;
  }

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const n = samples.length;
  ctx.strokeStyle = COLOR_SIGNAL;
  ctx.lineWidth = Math.max(1, dpr);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const ratio = n <= 1 ? 0 : i / (n - 1);
    const x = pad + ratio * (w - 2 * pad);
    const y = h - pad - ((samples[i] - ymin) / (ymax - ymin)) * (h - 2 * pad);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = COLOR_POINTS;
  const pointRadius = Math.max(2 * dpr, 2);
  for (let i = 0; i < n; i++) {
    const ratio = n <= 1 ? 0 : i / (n - 1);
    const x = pad + ratio * (w - 2 * pad);
    const y = h - pad - ((samples[i] - ymin) / (ymax - ymin)) * (h - 2 * pad);
    ctx.beginPath();
    ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  const periodMarkers = options.periodMarkers ?? 0;
  const hasPeriodMarkers = Number.isFinite(periodMarkers) && periodMarkers > 0;
  const xLabelY = xAxisLabelY(h, hasPeriodMarkers);

  drawLabel(ctx, title, pad, pad - 10);
  drawLabel(ctx, xLabel, w - pad - ctx.measureText(xLabel).width, xLabelY);
  drawLabel(ctx, yLabel, 8, yAxisLabelY(pad));
  if (hasPeriodMarkers) {
    drawPeriodMarkers(ctx, w, h, pad, periodMarkers);
  }

  ctx.strokeStyle = COLOR_GRID;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 1; k <= 3; k++) {
    const yy = pad + (k / 4) * (h - 2 * pad);
    ctx.moveTo(pad, yy);
    ctx.lineTo(w - pad, yy);
  }
  ctx.stroke();
}

export function plotSignalOverlay(canvas, denseSamples, sampledPoints, title, xLabel, yLabel, options = {}) {
  const { w, h } = fitCanvas(canvas);
  const ctx = canvas.getContext("2d");
  clear(ctx, w, h);

  const { pad } = drawAxes(ctx, w, h, 34);

  let ymin = Infinity;
  let ymax = -Infinity;
  for (const v of denseSamples) {
    if (v < ymin) ymin = v;
    if (v > ymax) ymax = v;
  }
  for (const v of sampledPoints) {
    if (v < ymin) ymin = v;
    if (v > ymax) ymax = v;
  }
  if (!isFinite(ymin) || !isFinite(ymax) || ymin === ymax) {
    ymin = -1;
    ymax = 1;
  }

  const dpr = Math.max(1, window.devicePixelRatio || 1);

  const nDense = denseSamples.length;
  ctx.strokeStyle = COLOR_SIGNAL;
  ctx.lineWidth = Math.max(1, dpr);
  ctx.beginPath();
  for (let i = 0; i < nDense; i++) {
    const ratio = nDense <= 1 ? 0 : i / (nDense - 1);
    const x = pad + ratio * (w - 2 * pad);
    const y = h - pad - ((denseSamples[i] - ymin) / (ymax - ymin)) * (h - 2 * pad);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const nPts = sampledPoints.length;
  ctx.strokeStyle = COLOR_POINTS_LINE;
  ctx.lineWidth = Math.max(1, dpr);
  ctx.beginPath();
  for (let i = 0; i < nPts; i++) {
    const ratio = nPts <= 1 ? 0 : i / (nPts - 1);
    const x = pad + ratio * (w - 2 * pad);
    const y = h - pad - ((sampledPoints[i] - ymin) / (ymax - ymin)) * (h - 2 * pad);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = COLOR_POINTS;
  const pointRadius = Math.max(2 * dpr, 2);
  for (let i = 0; i < nPts; i++) {
    const ratio = nPts <= 1 ? 0 : i / (nPts - 1);
    const x = pad + ratio * (w - 2 * pad);
    const y = h - pad - ((sampledPoints[i] - ymin) / (ymax - ymin)) * (h - 2 * pad);
    ctx.beginPath();
    ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  const periodMarkers = options.periodMarkers ?? 0;
  const hasPeriodMarkers = Number.isFinite(periodMarkers) && periodMarkers > 0;
  const xLabelY = xAxisLabelY(h, hasPeriodMarkers);

  drawLabel(ctx, title, pad, pad - 10);
  drawLabel(ctx, xLabel, w - pad - ctx.measureText(xLabel).width, xLabelY);
  drawLabel(ctx, yLabel, 8, yAxisLabelY(pad));
  if (hasPeriodMarkers) {
    drawPeriodMarkers(ctx, w, h, pad, periodMarkers);
  }

  ctx.strokeStyle = COLOR_GRID;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 1; k <= 3; k++) {
    const yy = pad + (k / 4) * (h - 2 * pad);
    ctx.moveTo(pad, yy);
    ctx.lineTo(w - pad, yy);
  }
  ctx.stroke();
}

export function plotSpectrum(canvas, mags, freqs, title) {
  const { w, h } = fitCanvas(canvas);
  const ctx = canvas.getContext("2d");
  clear(ctx, w, h);

  const { pad } = drawAxes(ctx, w, h, 34);

  let maxMag = 1e-12;
  for (const m of mags) {
    if (m > maxMag) maxMag = m;
  }

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const n = mags.length;
  ctx.strokeStyle = COLOR_SPECTRUM;
  ctx.lineWidth = Math.max(1, dpr);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = pad + (i / (n - 1)) * (w - 2 * pad);
    const y = h - pad - (mags[i] / maxMag) * (h - 2 * pad);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  drawLabel(ctx, title, pad, pad - 10);
  drawLabel(ctx, "frequency (Hz)", w - pad - ctx.measureText("frequency (Hz)").width, h - 10);
  drawLabel(ctx, "magnitude", 8, pad);

  const peaks = [];
  for (let i = 1; i < n - 1; i++) {
    if (mags[i] > mags[i - 1] && mags[i] > mags[i + 1]) peaks.push([mags[i], i]);
  }
  peaks.sort((a, b) => b[0] - a[0]);

  const top = peaks.slice(0, 2);
  ctx.fillStyle = COLOR_LABEL;
  ctx.font = `${Math.floor(12 * dpr)}px ui-monospace, sfmono-regular, menlo, monospace`;
  for (const [, idx] of top) {
    const f = freqs[idx];
    const x = pad + (idx / (n - 1)) * (w - 2 * pad);
    const y = h - pad - (mags[idx] / maxMag) * (h - 2 * pad);
    ctx.beginPath();
    ctx.arc(x, y, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`${Math.round(f)} Hz`, x + 8, Math.max(pad + 12, y - 10));
  }
}
