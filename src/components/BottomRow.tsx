import type { AudioData } from '../audio/types';
import Turntable from './widgets/Turntable';

interface Props {
  audioDataRef: React.RefObject<AudioData>;
}

export default function BottomRow({ audioDataRef }: Props) {
  return (
    <div className="bottom-row">
      <Turntable audioDataRef={audioDataRef} bandKey="subBass" label="TT-1 SUB" baseSpeed={0.002} barCountOverride={96} />
      <Turntable audioDataRef={audioDataRef} bandKey="bass" label="TT-2 BASS" baseSpeed={0.003} barCountOverride={112} />
      <Turntable audioDataRef={audioDataRef} bandKey="lowMid" label="TT-3 LO-MID" baseSpeed={0.004} barCountOverride={128} />
      <Turntable audioDataRef={audioDataRef} bandKey="mid" label="TT-4 MID" baseSpeed={0.003} barCountOverride={144} />
      <Turntable audioDataRef={audioDataRef} bandKey="highMid" label="TT-5 HI-MID" baseSpeed={0.005} barCountOverride={160} />
    </div>
  );
}
