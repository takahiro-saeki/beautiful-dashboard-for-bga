import { useEffect, useRef, useState } from 'react';
import type { AudioData } from '../../audio/types';
import { COLORS } from '../../rendering/colors';

interface Props {
  audioDataRef: React.RefObject<AudioData>;
}

interface Stats {
  amplitude: string;
  peak: string;
  beat: boolean;
  freq: string;
}

export default function StatsPanel({ audioDataRef }: Props) {
  const [stats, setStats] = useState<Stats>({
    amplitude: '0.00',
    peak: '0.00',
    beat: false,
    freq: '---',
  });
  const intervalRef = useRef<number>(0);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      const d = audioDataRef.current;
      if (!d) return;

      // find dominant frequency index
      let maxIdx = 0;
      let maxVal = 0;
      for (let i = 0; i < d.frequency.length; i++) {
        if (d.frequency[i] > maxVal) {
          maxVal = d.frequency[i];
          maxIdx = i;
        }
      }
      const sampleRate = 44100;
      const dominantHz = maxVal > 10 ? Math.round((maxIdx * sampleRate) / 2048) : 0;

      setStats({
        amplitude: d.amplitude.toFixed(3),
        peak: d.peak.toFixed(3),
        beat: d.beat,
        freq: dominantHz > 0 ? `${dominantHz} Hz` : '---',
      });
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [audioDataRef]);

  return (
    <div
      style={{
        padding: '12px 16px',
        background: COLORS.bgPanel,
        border: `1px solid ${COLORS.border}`,
        fontFamily: 'monospace',
        fontSize: '11px',
        color: COLORS.text,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ color: COLORS.textDim, fontSize: '10px', marginBottom: '2px' }}>
        SIGNAL STATS
      </div>
      <div>
        <span style={{ color: COLORS.textDim }}>AMP </span>
        <span style={{ color: COLORS.textBright }}>{stats.amplitude}</span>
      </div>
      <div>
        <span style={{ color: COLORS.textDim }}>PEAK </span>
        <span style={{ color: COLORS.textBright }}>{stats.peak}</span>
      </div>
      <div>
        <span style={{ color: COLORS.textDim }}>FREQ </span>
        <span style={{ color: COLORS.textBright }}>{stats.freq}</span>
      </div>
      <div>
        <span style={{ color: COLORS.textDim }}>BEAT </span>
        <span
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: stats.beat ? COLORS.textBright : COLORS.lineDim,
            boxShadow: stats.beat ? `0 0 8px ${COLORS.glow}` : 'none',
            verticalAlign: 'middle',
          }}
        />
      </div>
    </div>
  );
}
