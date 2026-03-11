import { useRef, useEffect } from 'react';
import type { AudioData } from '../../audio/types';
import { useAnimationFrame } from '../../hooks/useAnimationFrame';

interface Props {
  draw: (ctx: CanvasRenderingContext2D, audioData: AudioData, time: number) => void;
  audioDataRef: React.RefObject<AudioData>;
  className?: string;
}

export default function CanvasWidget({ draw, audioDataRef, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctxRef.current = canvas.getContext('2d');

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      sizeRef.current = { w: width * dpr, h: height * dpr };
      const ctx = ctxRef.current;
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        sizeRef.current = { w: width, h: height };
      }
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useAnimationFrame((time) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return;
    ctx.clearRect(0, 0, w, h);
    draw(ctx, audioDataRef.current!, time);
  });

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
