import { useCallback, useRef } from 'react';
import type { AudioData } from '../../audio/types';
import CanvasWidget from './CanvasWidget';
import { COLORS } from '../../rendering/colors';
import { drawPanelBg, drawBorder, applyGlow, clearGlow } from '../../rendering/drawUtils';

interface Props {
  audioDataRef: React.RefObject<AudioData>;
}

export default function RadarDisplay({ audioDataRef }: Props) {
  const sweepAngleRef = useRef(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, data: AudioData, _time: number) => {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);

    drawPanelBg(ctx, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) * 0.85;
    const { frequency, amplitude, beat } = data;

    // concentric circles
    ctx.strokeStyle = COLORS.lineDim;
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (r / 4) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // cross hairs
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.stroke();

    // sweep
    sweepAngleRef.current += 0.02 + amplitude * 0.03;
    const angle = sweepAngleRef.current;

    applyGlow(ctx, 10);
    const sweepGrad = ctx.createConicGradient(angle - Math.PI / 3, cx, cy);
    sweepGrad.addColorStop(0, 'transparent');
    sweepGrad.addColorStop(0.8, 'transparent');
    sweepGrad.addColorStop(1, `rgba(255, 255, 255, ${0.08 + amplitude * 0.1})`);
    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // sweep line
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + amplitude * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.stroke();
    clearGlow(ctx);

    // frequency blips
    const blipCount = 32;
    for (let i = 0; i < blipCount; i++) {
      const a = (i / blipCount) * Math.PI * 2;
      const idx = Math.floor((i / blipCount) * frequency.length);
      const val = frequency[idx] / 255;
      if (val < 0.1) continue;
      const dist = r * (0.2 + val * 0.7);
      const bx = cx + Math.cos(a) * dist;
      const by = cy + Math.sin(a) * dist;
      const size = 1 + val * 3;
      ctx.fillStyle = `rgba(255, 255, 255, ${val * 0.8})`;
      ctx.beginPath();
      ctx.arc(bx, by, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // beat pulse
    if (beat) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawBorder(ctx, w, h);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px monospace';
    ctx.fillText('RADAR', 8, 16);
  }, []);

  return <CanvasWidget draw={draw} audioDataRef={audioDataRef} />;
}
