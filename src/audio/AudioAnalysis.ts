import type { FrequencyBands } from './types';

const BAND_RANGES = {
  subBass: [0, 4],
  bass: [4, 12],
  lowMid: [12, 40],
  mid: [40, 100],
  highMid: [100, 200],
  high: [200, 512],
} as const;

export function extractBands(frequency: Uint8Array): FrequencyBands {
  const bands = {} as FrequencyBands;
  for (const [name, [start, end]] of Object.entries(BAND_RANGES)) {
    let sum = 0;
    for (let i = start; i < end && i < frequency.length; i++) {
      sum += frequency[i];
    }
    (bands as unknown as Record<string, number>)[name] = sum / ((end - start) * 255);
  }
  return bands;
}

export function computeAmplitude(timeDomain: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < timeDomain.length; i++) {
    const v = timeDomain[i];
    sum += v * v;
  }
  return Math.sqrt(sum / timeDomain.length);
}

export function computePeak(timeDomain: Float32Array): number {
  let max = 0;
  for (let i = 0; i < timeDomain.length; i++) {
    const abs = Math.abs(timeDomain[i]);
    if (abs > max) max = abs;
  }
  return max;
}

export class BeatDetector {
  private history: number[] = [];
  private threshold = 1.3;
  private cooldown = 0;

  detect(amplitude: number): boolean {
    this.history.push(amplitude);
    if (this.history.length > 60) this.history.shift();

    if (this.cooldown > 0) {
      this.cooldown--;
      return false;
    }

    const avg =
      this.history.reduce((a, b) => a + b, 0) / this.history.length;

    if (amplitude > avg * this.threshold && amplitude > 0.05) {
      this.cooldown = 8;
      return true;
    }
    return false;
  }
}
