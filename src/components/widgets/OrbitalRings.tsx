import { useCallback, useRef } from 'react';
import type { AudioData } from '../../audio/types';
import CanvasWidget from './CanvasWidget';
import { COLORS } from '../../rendering/colors';
import { drawPanelBg, drawBorder, applyGlow, clearGlow } from '../../rendering/drawUtils';

interface Props {
  audioDataRef: React.RefObject<AudioData>;
}

export default function OrbitalRings({ audioDataRef }: Props) {
  const rotationRef = useRef(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, data: AudioData, _time: number) => {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);

    drawPanelBg(ctx, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(cx, cy) * 0.85;
    const { bands, amplitude, beat } = data;
    const bandValues = Object.values(bands);

    rotationRef.current += 0.005 + amplitude * 0.02;
    const baseRot = rotationRef.current;

    // Draw 6 orbiting ellipses
    for (let i = 0; i < 6; i++) {
      const val = bandValues[i];
      const ringR = maxR * (0.3 + i * 0.12);
      const tilt = (Math.PI / 6) * i + baseRot * (i % 2 === 0 ? 1 : -1);
      const alpha = 0.15 + val * 0.6;
      const lineW = 0.5 + val * 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);

      applyGlow(ctx, val * 12);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = lineW;
      ctx.beginPath();
      ctx.ellipse(0, 0, ringR, ringR * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      clearGlow(ctx);

      // orbiting dot
      const dotAngle = baseRot * (1.5 + i * 0.3);
      const dx = Math.cos(dotAngle) * ringR;
      const dy = Math.sin(dotAngle) * ringR * 0.35;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + val * 0.5})`;
      ctx.beginPath();
      ctx.arc(dx, dy, 2 + val * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // center core
    const coreSize = 3 + amplitude * 10;
    applyGlow(ctx, 15 + amplitude * 20);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + amplitude * 0.5})`;
    ctx.beginPath();
    ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
    ctx.fill();
    clearGlow(ctx);

    if (beat) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawBorder(ctx, w, h);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px monospace';
    ctx.fillText('ORBITAL', 8, 16);
  }, []);

  return <CanvasWidget draw={draw} audioDataRef={audioDataRef} />;
}
