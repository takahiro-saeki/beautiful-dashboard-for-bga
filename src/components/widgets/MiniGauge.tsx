import { useCallback } from 'react';
import type { AudioData } from '../../audio/types';
import type { FrequencyBands } from '../../audio/types';
import CanvasWidget from './CanvasWidget';
import { COLORS } from '../../rendering/colors';
import { applyGlow, clearGlow } from '../../rendering/drawUtils';

interface Props {
  audioDataRef: React.RefObject<AudioData>;
  bandKey: keyof FrequencyBands;
  label: string;
}

export default function MiniGauge({ audioDataRef, bandKey, label }: Props) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, data: AudioData, _time: number) => {
      const w = ctx.canvas.width / (window.devicePixelRatio || 1);
      const h = ctx.canvas.height / (window.devicePixelRatio || 1);

      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(cx, cy) * 0.7;
      const val = data.bands[bandKey];

      // background arc
      ctx.strokeStyle = COLORS.lineDim;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25);
      ctx.stroke();

      // value arc
      const startAngle = Math.PI * 0.75;
      const endAngle = startAngle + val * Math.PI * 1.5;
      const alpha = 0.4 + val * 0.6;

      applyGlow(ctx, 4 + val * 10);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.stroke();
      clearGlow(ctx);

      // value text
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + val * 0.5})`;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(val * 100).toString(), cx, cy - 2);

      // label
      ctx.fillStyle = COLORS.textDim;
      ctx.font = '8px monospace';
      ctx.fillText(label, cx, cy + r * 0.55);

      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    },
    [bandKey, label],
  );

  return <CanvasWidget draw={draw} audioDataRef={audioDataRef} />;
}
