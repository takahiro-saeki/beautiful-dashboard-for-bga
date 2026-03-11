export interface FrequencyBands {
  subBass: number;
  bass: number;
  lowMid: number;
  mid: number;
  highMid: number;
  high: number;
}

export interface AudioData {
  timeDomain: Float32Array;
  frequency: Uint8Array;
  bands: FrequencyBands;
  amplitude: number;
  beat: boolean;
  peak: number;
}

export type AudioSourceType = 'mic' | 'file';
