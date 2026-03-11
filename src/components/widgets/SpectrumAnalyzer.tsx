import { useCallback, useRef } from 'react';
import type { AudioData } from '../../audio/types';
import CanvasWidget from './CanvasWidget';
import { COLORS } from '../../rendering/colors';
import { drawPanelBg, drawBorder, drawScanline, applyGlow, clearGlow } from '../../rendering/drawUtils';

interface Props {
  audioDataRef: React.RefObject<AudioData>;
}

const FREQ_LABELS = [
  { bin: 1, label: '60Hz' },
  { bin: 5, label: '250Hz' },
  { bin: 12, label: '500Hz' },
  { bin: 23, label: '1kHz' },
  { bin: 35, label: '2kHz' },
  { bin: 47, label: '5kHz' },
  { bin: 58, label: '10kHz' },
];

export default function SpectrumAnalyzer({ audioDataRef }: Props) {
  const peakHoldRef = useRef<Float32Array | null>(null);
  const prevFrameRef = useRef<Float32Array | null>(null);
  const avgBufRef = useRef<Float32Array[]>([]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, data: AudioData, time: number) => {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);

    drawPanelBg(ctx, w, h);
    drawScanline(ctx, w, h, time);

    const { frequency, amplitude } = data;
    const barCount = 64;
    const gap = 2;
    const barWidth = (w - gap * barCount) / barCount;

    // Init persistent arrays
    if (!peakHoldRef.current) peakHoldRef.current = new Float32Array(barCount);
    if (!prevFrameRef.current) prevFrameRef.current = new Float32Array(barCount);
    const peaks = peakHoldRef.current;
    const prevFrame = prevFrameRef.current;

    // Current frame values
    const currentVals = new Float32Array(barCount);
    for (let i = 0; i < barCount; i++) {
      const idx = Math.floor((i / barCount) * frequency.length);
      currentVals[i] = frequency[idx] / 255;
    }

    // Moving average (4 frames)
    const avgBuf = avgBufRef.current;
    avgBuf.push(new Float32Array(currentVals));
    if (avgBuf.length > 4) avgBuf.shift();
    const avgVals = new Float32Array(barCount);
    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (const frame of avgBuf) sum += frame[i];
      avgVals[i] = sum / avgBuf.length;
    }

    // --- dB threshold lines ---
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
    ctx.lineWidth = 0.5;
    ctx.font = '7px monospace';
    ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
    ctx.textAlign = 'right';
    const dbLevels = [0.25, 0.5, 0.75];
    for (const lev of dbLevels) {
      const y = h - lev * h * 0.85;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      const db = (20 * Math.log10(lev)).toFixed(0);
      ctx.fillText(`${db}dB`, w - 4, y - 2);
    }
    ctx.setLineDash([]);
    ctx.restore();

    // --- Mirror bars (reflection below, alpha 0.1, 30% height) ---
    for (let i = 0; i < barCount; i++) {
      const val = currentVals[i];
      const barH = val * h * 0.85;
      const mirrorH = barH * 0.3;
      const x = i * (barWidth + gap) + gap / 2;
      ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
      ctx.fillRect(x, h, barWidth, mirrorH * 0.5); // tiny reflection below baseline
    }

    // --- Decay trail (previous frame ghost) ---
    for (let i = 0; i < barCount; i++) {
      const val = prevFrame[i];
      const barH = val * h * 0.85;
      const x = i * (barWidth + gap) + gap / 2;
      const y = h - barH;
      ctx.fillStyle = `rgba(255, 255, 255, 0.12)`;
      ctx.fillRect(x, y, barWidth, barH);
    }

    // --- Main bars ---
    applyGlow(ctx, 4 + amplitude * 12);
    for (let i = 0; i < barCount; i++) {
      const val = currentVals[i];
      const barH = val * h * 0.85;
      const x = i * (barWidth + gap) + gap / 2;
      const y = h - barH;

      const alpha = 0.3 + val * 0.7;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(x, y, barWidth, barH);

      // Update peak hold (decay)
      if (val > peaks[i]) peaks[i] = val;
      else peaks[i] *= 0.993;

      // Store for next frame
      prevFrame[i] = val;
    }
    clearGlow(ctx);

    // --- Peak hold markers ---
    ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
    for (let i = 0; i < barCount; i++) {
      const peakH = peaks[i] * h * 0.85;
      const x = i * (barWidth + gap) + gap / 2;
      const y = h - peakH;
      ctx.fillRect(x, y, barWidth, 2);
    }

    // --- Moving average indicators (offset to right) ---
    for (let i = 0; i < barCount; i++) {
      const avgH = avgVals[i] * h * 0.85;
      const x = i * (barWidth + gap) + gap / 2 + barWidth + 1;
      const y = h - avgH;
      ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
      ctx.fillRect(x, y, 1, avgH);
    }

    // --- Spectrum envelope curve ---
    ctx.strokeStyle = `rgba(255, 255, 255, 0.25)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < barCount; i++) {
      const val = currentVals[i];
      const barH = val * h * 0.85;
      const x = i * (barWidth + gap) + gap / 2 + barWidth / 2;
      const y = h - barH;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * (barWidth + gap) + gap / 2 + barWidth / 2;
        const prevVal = currentVals[i - 1];
        const prevY = h - prevVal * h * 0.85;
        const cpx = (prevX + x) / 2;
        ctx.quadraticCurveTo(cpx, prevY, x, y);
      }
    }
    ctx.stroke();

    // --- Frequency labels ---
    ctx.fillStyle = `rgba(255, 255, 255, 0.25)`;
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    for (const fl of FREQ_LABELS) {
      if (fl.bin < barCount) {
        const x = fl.bin * (barWidth + gap) + gap / 2 + barWidth / 2;
        ctx.fillText(fl.label, x, h - 3);
      }
    }

    // --- Numerical readout (dominant frequency + dB) ---
    let maxBin = 0, maxVal = 0;
    for (let i = 0; i < barCount; i++) {
      if (currentVals[i] > maxVal) { maxVal = currentVals[i]; maxBin = i; }
    }
    const domFreq = Math.round((maxBin / barCount) * 22050);
    const domDb = maxVal > 0 ? (20 * Math.log10(maxVal)).toFixed(1) : '-∞';
    ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`DOM ${domFreq}Hz`, w - 8, 16);
    ctx.fillText(`${domDb}dB`, w - 8, 27);
    ctx.textAlign = 'start';

    drawBorder(ctx, w, h);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px monospace';
    ctx.fillText('SPECTRUM', 8, 16);
  }, []);

  return <CanvasWidget draw={draw} audioDataRef={audioDataRef} />;
}
