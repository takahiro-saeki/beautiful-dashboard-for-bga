import { useCallback, useRef } from 'react';
import type { AudioData, FrequencyBands } from '../../audio/types';
import CanvasWidget from './CanvasWidget';
import { COLORS } from '../../rendering/colors';
import { drawPanelBg, drawBorder, applyGlow, clearGlow } from '../../rendering/drawUtils';
import { mapRange } from '../../utils/math';

interface Props {
  audioDataRef: React.RefObject<AudioData>;
  bandKey?: keyof FrequencyBands;
  label?: string;
  baseSpeed?: number;
  barCountOverride?: number;
}

export default function Turntable({ audioDataRef, bandKey, label, baseSpeed = 0.003, barCountOverride }: Props) {
  const rotationRef = useRef(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, data: AudioData, _time: number) => {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);

    drawPanelBg(ctx, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(cx, cy) * 0.88;
    const { frequency, timeDomain, amplitude, beat, bands } = data;

    const driveVal = bandKey ? bands[bandKey] : amplitude;
    rotationRef.current += baseSpeed + driveVal * 0.015;
    const rot = rotationRef.current;

    // grooves (reduced to 12 for small turntables)
    const grooveCount = bandKey ? 12 : 20;
    ctx.strokeStyle = COLORS.lineDim;
    ctx.lineWidth = 0.3;
    for (let i = 0; i < grooveCount; i++) {
      const gr = maxR * (0.25 + (i / grooveCount) * 0.7);
      ctx.beginPath();
      ctx.arc(cx, cy, gr, 0, Math.PI * 2);
      ctx.stroke();
    }

    // radial frequency bars
    const barCount = barCountOverride ?? 128;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    applyGlow(ctx, 6 + driveVal * 15);

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const idx = Math.floor((i / barCount) * frequency.length);
      const val = frequency[idx] / 255;
      const innerR = maxR * 0.3;
      const outerR = innerR + val * maxR * 0.55;

      const alpha = 0.2 + val * 0.7;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1 + val * 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.stroke();
    }

    clearGlow(ctx);
    ctx.restore();

    // inner waveform circle
    applyGlow(ctx, 8);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + driveVal * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const innerR = maxR * 0.25;
    for (let i = 0; i < timeDomain.length; i += 4) {
      const angle = (i / timeDomain.length) * Math.PI * 2 + rot;
      const r = innerR + timeDomain[i] * innerR * 0.4;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    clearGlow(ctx);

    // center dot
    const dotR = 3 + driveVal * 5;
    applyGlow(ctx, 10);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + driveVal * 0.4})`;
    ctx.beginPath();
    ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
    ctx.fill();
    clearGlow(ctx);

    // beat ring
    if (beat) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 0.95, 0, Math.PI * 2);
      ctx.stroke();
    }

    // RPM text
    const rpm = mapRange(driveVal, 0, 0.5, 0, 45);
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${rpm.toFixed(1)} RPM`, cx, cy + maxR + 12);
    ctx.textAlign = 'start';

    drawBorder(ctx, w, h);

    // label
    const displayLabel = label ?? 'TURNTABLE';
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '9px monospace';
    ctx.textAlign = 'start';
    ctx.fillText(displayLabel, 6, 14);
  }, [bandKey, label, baseSpeed, barCountOverride]);

  return <CanvasWidget draw={draw} audioDataRef={audioDataRef} />;
}
