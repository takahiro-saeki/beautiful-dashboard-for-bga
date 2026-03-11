import { useCallback, useRef } from 'react';
import type { AudioData } from '../../audio/types';
import CanvasWidget from './CanvasWidget';
import { COLORS } from '../../rendering/colors';
import { drawPanelBg, drawBorder, drawGrid, applyGlow, clearGlow } from '../../rendering/drawUtils';

interface Props {
  audioDataRef: React.RefObject<AudioData>;
}

const TRAIL_LENGTH = 8;

export default function SignalScope({ audioDataRef }: Props) {
  const historyRef = useRef<Array<{ x: number; y: number }[]>>([]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, data: AudioData, _time: number) => {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);

    drawPanelBg(ctx, w, h);
    drawGrid(ctx, w, h, 25);

    const cx = w / 2;
    const cy = h / 2;
    const { timeDomain, amplitude } = data;
    const scale = Math.min(cx, cy) * 0.8;

    // --- Concentric circle markers (25%, 50%, 75%, 100%) ---
    ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
    ctx.lineWidth = 0.5;
    ctx.font = '7px monospace';
    ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
    ctx.textAlign = 'left';
    const circleScales = [0.25, 0.5, 0.75, 1.0];
    for (const s of circleScales) {
      const r = scale * s;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText(`${(s * 100).toFixed(0)}%`, cx + r + 2, cy - 2);
    }

    // --- Angle indicators (45 degree radial lines + labels) ---
    ctx.strokeStyle = `rgba(255, 255, 255, 0.08)`;
    ctx.lineWidth = 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, 0.12)`;
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    for (let deg = 0; deg < 360; deg += 45) {
      const rad = (deg * Math.PI) / 180;
      const ex = cx + Math.cos(rad) * scale;
      const ey = cy + Math.sin(rad) * scale;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      const lx = cx + Math.cos(rad) * (scale + 10);
      const ly = cy + Math.sin(rad) * (scale + 10);
      ctx.fillText(`${deg}°`, lx, ly);
    }

    // --- Crosshairs with tick marks ---
    ctx.strokeStyle = COLORS.lineDim;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();

    // Tick marks on axes (every 20%)
    ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
    for (const s of [0.2, 0.4, 0.6, 0.8, 1.0]) {
      const tickLen = 3;
      const r = scale * s;
      // horizontal axis ticks
      ctx.beginPath();
      ctx.moveTo(cx + r, cy - tickLen);
      ctx.lineTo(cx + r, cy + tickLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - r, cy - tickLen);
      ctx.lineTo(cx - r, cy + tickLen);
      ctx.stroke();
      // vertical axis ticks
      ctx.beginPath();
      ctx.moveTo(cx - tickLen, cy + r);
      ctx.lineTo(cx + tickLen, cy + r);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - tickLen, cy - r);
      ctx.lineTo(cx + tickLen, cy - r);
      ctx.stroke();
    }

    // Compute current XY points for Lissajous
    const offset = Math.floor(timeDomain.length / 4);
    const currentPoints: { x: number; y: number }[] = [];
    for (let i = 0; i < timeDomain.length - offset; i += 2) {
      currentPoints.push({
        x: cx + timeDomain[i] * scale,
        y: cy + timeDomain[i + offset] * scale,
      });
    }

    // Update history
    const history = historyRef.current;
    history.push(currentPoints);
    if (history.length > TRAIL_LENGTH) history.shift();

    // --- History trail (phosphor decay) ---
    for (let t = 0; t < history.length - 1; t++) {
      const trail = history[t];
      const alpha = ((t + 1) / history.length) * 0.12;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        if (i === 0) ctx.moveTo(trail[i].x, trail[i].y);
        else ctx.lineTo(trail[i].x, trail[i].y);
      }
      ctx.stroke();
    }

    // --- Main Lissajous ---
    applyGlow(ctx, 6 + amplitude * 15);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + amplitude * 0.6})`;
    ctx.lineWidth = 1 + amplitude * 1.5;
    ctx.beginPath();
    for (let i = 0; i < currentPoints.length; i++) {
      if (i === 0) ctx.moveTo(currentPoints[i].x, currentPoints[i].y);
      else ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
    }
    ctx.stroke();
    clearGlow(ctx);

    // --- Beam position dot (latest XY with glow) ---
    if (currentPoints.length > 0) {
      const lastPt = currentPoints[currentPoints.length - 1];
      applyGlow(ctx, 15);
      ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
      ctx.beginPath();
      ctx.arc(lastPt.x, lastPt.y, 3 + amplitude * 3, 0, Math.PI * 2);
      ctx.fill();
      clearGlow(ctx);

      // --- Displacement vector (center to current position) ---
      ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(lastPt.x, lastPt.y);
      ctx.stroke();

      // Displacement length label
      const dx = lastPt.x - cx;
      const dy = lastPt.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / scale;
      ctx.fillStyle = `rgba(255, 255, 255, 0.25)`;
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      const midLx = (cx + lastPt.x) / 2;
      const midLy = (cy + lastPt.y) / 2;
      ctx.fillText(`${dist.toFixed(2)}`, midLx, midLy - 4);
    }

    // --- Phase / amplitude readout (bottom-right corner) ---
    const latestX = timeDomain[timeDomain.length - offset - 2] || 0;
    const latestY = timeDomain[timeDomain.length - 2] || 0;
    const phase = Math.atan2(latestY, latestX) * (180 / Math.PI);
    ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`PHS ${phase.toFixed(1)}°`, w - 8, h - 22);
    ctx.fillText(`AMP ${amplitude.toFixed(3)}`, w - 8, h - 11);
    ctx.textAlign = 'start';

    drawBorder(ctx, w, h);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px monospace';
    ctx.fillText('XY SCOPE', 8, 16);
  }, []);

  return <CanvasWidget draw={draw} audioDataRef={audioDataRef} />;
}
