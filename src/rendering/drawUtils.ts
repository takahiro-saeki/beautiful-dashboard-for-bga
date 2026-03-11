import { COLORS } from './colors';

export function applyGlow(ctx: CanvasRenderingContext2D, radius: number = 8) {
  ctx.shadowColor = COLORS.glow;
  ctx.shadowBlur = radius;
}

export function clearGlow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spacing: number = 40,
) {
  ctx.strokeStyle = COLORS.lineDim;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = spacing; x < w; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = spacing; y < h; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}

export function drawScanline(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  speed: number = 0.0003,
) {
  const y = (time * speed * h) % h;
  const gradient = ctx.createLinearGradient(0, y - 20, 0, y + 20);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y - 20, w, 40);
}

export function drawPanelBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = COLORS.bgPanel;
  ctx.fillRect(0, 0, w, h);
}

export function drawBorder(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}
