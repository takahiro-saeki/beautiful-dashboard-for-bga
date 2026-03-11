import { useCallback, useRef } from 'react';
import type { AudioData } from '../../audio/types';
import CanvasWidget from './CanvasWidget';
import { COLORS } from '../../rendering/colors';
import { drawPanelBg, drawBorder, drawGrid, drawScanline, applyGlow, clearGlow } from '../../rendering/drawUtils';

interface Props {
  audioDataRef: React.RefObject<AudioData>;
}

export default function WaveformDisplay({ audioDataRef }: Props) {
  const peakHoldPosRef = useRef(0);
  const peakHoldNegRef = useRef(0);
  const triggerYRef = useRef(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, data: AudioData, time: number) => {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);

    drawPanelBg(ctx, w, h);
    drawGrid(ctx, w, h, 30);
    drawScanline(ctx, w, h, time);

    const { timeDomain, amplitude, peak } = data;
    const mid = h / 2;
    const step = w / timeDomain.length;

    // --- Amplitude threshold markers (dashed horizontal lines) ---
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 0.5;
    const thresholds = [0.25, 0.5, 0.75];
    for (const t of thresholds) {
      const yPos = mid - t * mid * 0.9;
      const yNeg = mid + t * mid * 0.9;
      ctx.strokeStyle = `rgba(255, 255, 255, 0.12)`;
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(w, yPos);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, yNeg);
      ctx.lineTo(w, yNeg);
      ctx.stroke();
      // threshold labels
      ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`±${(t * 100).toFixed(0)}%`, 4, yPos - 2);
    }
    ctx.setLineDash([]);
    ctx.restore();

    // --- X-axis tick marks ---
    ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
    ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`;
    ctx.lineWidth = 0.5;
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    for (let px = 50; px < w - 20; px += 50) {
      const sampleIdx = Math.floor(px / step);
      ctx.beginPath();
      ctx.moveTo(px, mid - 3);
      ctx.lineTo(px, mid + 3);
      ctx.stroke();
      ctx.fillText(`${sampleIdx}`, px, mid + 12);
    }

    // --- Ghost waveform (200 sample offset) ---
    const ghostOffset = 200;
    ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < timeDomain.length; i++) {
      const srcIdx = (i + ghostOffset) % timeDomain.length;
      const x = i * step;
      const y = mid + timeDomain[srcIdx] * mid * 0.9;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // --- Main waveform ---
    applyGlow(ctx, 6 + amplitude * 20);
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5 + amplitude * 2;
    ctx.beginPath();
    for (let i = 0; i < timeDomain.length; i++) {
      const x = i * step;
      const y = mid + timeDomain[i] * mid * 0.9;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    clearGlow(ctx);

    // --- Derivative waveform (small scale) ---
    ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i < timeDomain.length - 1; i++) {
      const diff = timeDomain[i + 1] - timeDomain[i];
      const x = i * step;
      const y = mid + diff * mid * 3; // amplified derivative
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // --- Peak hold lines (decay slowly) ---
    let maxPos = 0, maxNeg = 0;
    for (let i = 0; i < timeDomain.length; i++) {
      if (timeDomain[i] > maxPos) maxPos = timeDomain[i];
      if (timeDomain[i] < maxNeg) maxNeg = timeDomain[i];
    }
    peakHoldPosRef.current = Math.max(maxPos, peakHoldPosRef.current * 0.995);
    peakHoldNegRef.current = Math.min(maxNeg, peakHoldNegRef.current * 0.995);

    const peakYPos = mid + peakHoldPosRef.current * mid * 0.9;
    const peakYNeg = mid + peakHoldNegRef.current * mid * 0.9;
    ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, peakYPos);
    ctx.lineTo(w, peakYPos);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, peakYNeg);
    ctx.lineTo(w, peakYNeg);
    ctx.stroke();

    // --- Zero crossing trigger indicator ---
    let triggerSample = 0;
    for (let i = 1; i < timeDomain.length; i++) {
      if (timeDomain[i - 1] <= 0 && timeDomain[i] > 0) {
        triggerSample = i;
        break;
      }
    }
    const targetTriggerY = mid + timeDomain[triggerSample] * mid * 0.9;
    triggerYRef.current += (targetTriggerY - triggerYRef.current) * 0.15;
    // triangle marker on left edge
    ctx.fillStyle = `rgba(255, 255, 255, 0.5)`;
    ctx.beginPath();
    ctx.moveTo(0, triggerYRef.current);
    ctx.lineTo(8, triggerYRef.current - 4);
    ctx.lineTo(8, triggerYRef.current + 4);
    ctx.closePath();
    ctx.fill();

    // --- Center line ---
    ctx.strokeStyle = COLORS.lineDim;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    ctx.stroke();

    // --- Numerical readout (top-right) ---
    const rms = amplitude;
    ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`AMP ${rms.toFixed(3)}`, w - 8, 16);
    ctx.fillText(`PK  ${peak.toFixed(3)}`, w - 8, 27);
    const rmsDb = rms > 0 ? (20 * Math.log10(rms)).toFixed(1) : '-∞';
    ctx.fillText(`RMS ${rmsDb}dB`, w - 8, 38);
    ctx.textAlign = 'start';

    drawBorder(ctx, w, h);

    // label
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px monospace';
    ctx.fillText('WAVEFORM', 8, 16);
  }, []);

  return <CanvasWidget draw={draw} audioDataRef={audioDataRef} />;
}
