import { useCallback, useRef } from 'react';
import { COLORS } from '../../rendering/colors';
import type { AudioSourceType } from '../../audio/types';

interface Props {
  isActive: boolean;
  sourceType: AudioSourceType;
  fileName: string | null;
  onStartMic: () => void;
  onLoadFile: (file: File) => void;
  onStop: () => void;
}

export default function AudioControls({
  isActive,
  sourceType,
  fileName,
  onStartMic,
  onLoadFile,
  onStop,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith('audio/')) {
        onLoadFile(file);
      }
    },
    [onLoadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const buttonStyle: React.CSSProperties = {
    background: 'transparent',
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    padding: '6px 16px',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    borderColor: COLORS.borderLight,
    color: COLORS.textBright,
  };

  return (
    <div
      ref={dropZoneRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        background: COLORS.bgPanel,
        borderTop: `1px solid ${COLORS.border}`,
        fontFamily: 'monospace',
        fontSize: '11px',
        color: COLORS.textDim,
      }}
    >
      <button
        onClick={onStartMic}
        style={isActive && sourceType === 'mic' ? activeButtonStyle : buttonStyle}
      >
        MIC
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        style={isActive && sourceType === 'file' ? activeButtonStyle : buttonStyle}
      >
        FILE
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {isActive && (
        <button onClick={onStop} style={buttonStyle}>
          STOP
        </button>
      )}

      {fileName && (
        <span style={{ color: COLORS.text, marginLeft: '4px' }}>
          {fileName}
        </span>
      )}

      {!isActive && (
        <span style={{ marginLeft: 'auto', color: COLORS.textDim }}>
          Drop audio file or select input
        </span>
      )}
    </div>
  );
}
