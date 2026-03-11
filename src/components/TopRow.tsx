import type { AudioData } from '../audio/types';
import StatsPanel from './widgets/StatsPanel';
import MiniGauge from './widgets/MiniGauge';
import type { FrequencyBands } from '../audio/types';

interface Props {
  audioDataRef: React.RefObject<AudioData>;
}

const GAUGES: { key: keyof FrequencyBands; label: string }[] = [
  { key: 'subBass', label: 'SUB' },
  { key: 'bass', label: 'BASS' },
  { key: 'lowMid', label: 'LO-MID' },
  { key: 'mid', label: 'MID' },
  { key: 'highMid', label: 'HI-MID' },
];

export default function TopRow({ audioDataRef }: Props) {
  return (
    <div className="top-row">
      <div className="stats-cell">
        <StatsPanel audioDataRef={audioDataRef} />
      </div>
      {GAUGES.map((g) => (
        <div key={g.key} className="gauge-cell">
          <MiniGauge audioDataRef={audioDataRef} bandKey={g.key} label={g.label} />
        </div>
      ))}
    </div>
  );
}
