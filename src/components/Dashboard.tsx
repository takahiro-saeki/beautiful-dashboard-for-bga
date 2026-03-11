import type { AudioData } from '../audio/types';
import TopRow from './TopRow';
import MiddleRow from './MiddleRow';
import BottomRow from './BottomRow';

interface Props {
  audioDataRef: React.RefObject<AudioData>;
}

export default function Dashboard({ audioDataRef }: Props) {
  return (
    <div className="dashboard">
      <TopRow audioDataRef={audioDataRef} />
      <MiddleRow audioDataRef={audioDataRef} />
      <BottomRow audioDataRef={audioDataRef} />
    </div>
  );
}
