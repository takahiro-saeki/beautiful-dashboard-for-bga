import { useEffect, useRef, useCallback } from 'react';

export function useAnimationFrame(callback: (time: number) => void) {
  const rafRef = useRef<number>(0);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const loop = useCallback((time: number) => {
    callbackRef.current(time);
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);
}
