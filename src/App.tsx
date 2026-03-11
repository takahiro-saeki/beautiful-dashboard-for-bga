import { useAudioEngine } from './hooks/useAudioEngine';
import { useAnimationFrame } from './hooks/useAnimationFrame';
import Dashboard from './components/Dashboard';
import AudioControls from './components/controls/AudioControls';

export default function App() {
  const {
    audioDataRef,
    update,
    startMic,
    loadFile,
    stop,
    sourceType,
    isActive,
    fileName,
  } = useAudioEngine();

  useAnimationFrame(() => {
    update();
  });

  return (
    <div className="app">
      <Dashboard audioDataRef={audioDataRef} />
      <AudioControls
        isActive={isActive}
        sourceType={sourceType}
        fileName={fileName}
        onStartMic={startMic}
        onLoadFile={loadFile}
        onStop={stop}
      />
    </div>
  );
}
