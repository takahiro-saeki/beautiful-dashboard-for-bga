import type { AudioData } from '../audio/types';
import WaveformDisplay from './widgets/WaveformDisplay';
import SpectrumAnalyzer from './widgets/SpectrumAnalyzer';
import RadarDisplay from './widgets/RadarDisplay';
import OrbitalRings from './widgets/OrbitalRings';
import SignalScope from './widgets/SignalScope';

interface Props {
  audioDataRef: React.RefObject<AudioData>;
}

export default function MiddleRow({ audioDataRef }: Props) {
  return (
    <div className="middle-row">
      <WaveformDisplay audioDataRef={audioDataRef} />
      <SpectrumAnalyzer audioDataRef={audioDataRef} />
      <RadarDisplay audioDataRef={audioDataRef} />
      <OrbitalRings audioDataRef={audioDataRef} />
      <SignalScope audioDataRef={audioDataRef} />
    </div>
  );
}
