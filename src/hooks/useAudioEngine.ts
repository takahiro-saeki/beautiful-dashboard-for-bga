import { useRef, useCallback, useState } from 'react';
import type { AudioData, AudioSourceType } from '../audio/types';
import { extractBands, computeAmplitude, computePeak, BeatDetector } from '../audio/AudioAnalysis';

const EMPTY_BANDS = { subBass: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, high: 0 };

function createEmptyAudioData(): AudioData {
  return {
    timeDomain: new Float32Array(2048),
    frequency: new Uint8Array(1024),
    bands: { ...EMPTY_BANDS },
    amplitude: 0,
    beat: false,
    peak: 0,
  };
}

function generateMockAudioData(time: number, beatDetector: BeatDetector): AudioData {
  const t = time * 0.001; // convert ms to seconds

  // timeDomain: multiple sine waves + noise + slow amplitude modulation
  const timeDomain = new Float32Array(2048);
  const ampMod = 0.5 + 0.3 * Math.sin(t * 0.4) + 0.2 * Math.sin(t * 0.17);
  for (let i = 0; i < 2048; i++) {
    const phase = i / 2048;
    const val =
      0.3 * Math.sin(phase * Math.PI * 2 * 4.0 + t * 2.1) +
      0.15 * Math.sin(phase * Math.PI * 2 * 11.0 + t * 5.7) +
      0.1 * Math.sin(phase * Math.PI * 2 * 27.0 + t * 13.3) +
      0.05 * Math.sin(phase * Math.PI * 2 * 63.0 + t * 31.1) +
      (Math.random() - 0.5) * 0.04;
    timeDomain[i] = val * ampMod;
  }

  // frequency: Gaussian peaks that shift over time
  const frequency = new Uint8Array(1024);
  const peaks = [
    { center: 30 + 15 * Math.sin(t * 0.3), width: 12, height: 220 },
    { center: 80 + 20 * Math.sin(t * 0.5 + 1), width: 18, height: 180 },
    { center: 200 + 40 * Math.sin(t * 0.2 + 2), width: 30, height: 150 },
    { center: 400 + 60 * Math.sin(t * 0.7 + 3), width: 50, height: 120 },
  ];
  for (let i = 0; i < 1024; i++) {
    let val = Math.random() * 8; // noise floor
    for (const pk of peaks) {
      const dist = (i - pk.center) / pk.width;
      val += pk.height * Math.exp(-0.5 * dist * dist);
    }
    frequency[i] = Math.min(255, Math.max(0, val));
  }

  // beat spike: inject ~every 60 frames worth of time (~1 second)
  const beatPhase = (t * 1.2) % 1.0;
  if (beatPhase < 0.05) {
    for (let i = 0; i < 2048; i++) {
      timeDomain[i] *= 2.2;
    }
    for (let i = 0; i < 40; i++) {
      frequency[i] = Math.min(255, frequency[i] + 80);
    }
  }

  const amplitude = computeAmplitude(timeDomain);
  const peak = computePeak(timeDomain);
  const bands = extractBands(frequency);
  const beat = beatDetector.detect(amplitude);

  return { timeDomain, frequency, bands, amplitude, beat, peak };
}

export function useAudioEngine() {
  const audioDataRef = useRef<AudioData>(createEmptyAudioData());
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserTimeRef = useRef<AnalyserNode | null>(null);
  const analyserFreqRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const beatDetectorRef = useRef(new BeatDetector());
  const mockBeatDetectorRef = useRef(new BeatDetector());
  const [sourceType, setSourceType] = useState<AudioSourceType>('mic');
  const [isActive, setIsActive] = useState(false);
  const [isMock, setIsMock] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;

    if (!analyserTimeRef.current) {
      const a = ctx.createAnalyser();
      a.fftSize = 4096;
      a.smoothingTimeConstant = 0.8;
      analyserTimeRef.current = a;
    }
    if (!analyserFreqRef.current) {
      const a = ctx.createAnalyser();
      a.fftSize = 2048;
      a.smoothingTimeConstant = 0.85;
      analyserFreqRef.current = a;
    }
    return ctx;
  }, []);

  const disconnect = useCallback(() => {
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = '';
      audioElRef.current = null;
    }
  }, []);

  const startMic = useCallback(async () => {
    const ctx = ensureContext();
    disconnect();
    if (ctx.state === 'suspended') await ctx.resume();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyserTimeRef.current!);
    source.connect(analyserFreqRef.current!);
    sourceRef.current = source;
    setSourceType('mic');
    setIsActive(true);
    setIsMock(false);
    setFileName(null);
  }, [ensureContext, disconnect]);

  const loadFile = useCallback(
    async (file: File) => {
      const ctx = ensureContext();
      disconnect();
      if (ctx.state === 'suspended') await ctx.resume();

      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.src = URL.createObjectURL(file);
      audio.loop = true;
      audioElRef.current = audio;

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyserTimeRef.current!);
      source.connect(analyserFreqRef.current!);
      source.connect(ctx.destination);
      sourceRef.current = source;

      await audio.play();
      setSourceType('file');
      setIsActive(true);
      setIsMock(false);
      setFileName(file.name);
    },
    [ensureContext, disconnect],
  );

  const stop = useCallback(() => {
    disconnect();
    setIsActive(false);
    setIsMock(true);
  }, [disconnect]);

  const update = useCallback(() => {
    if (isMock) {
      audioDataRef.current = generateMockAudioData(performance.now(), mockBeatDetectorRef.current);
      return;
    }

    const timeAnalyser = analyserTimeRef.current;
    const freqAnalyser = analyserFreqRef.current;
    if (!timeAnalyser || !freqAnalyser) return;

    const timeDomain = new Float32Array(timeAnalyser.fftSize);
    timeAnalyser.getFloatTimeDomainData(timeDomain);

    const frequency = new Uint8Array(freqAnalyser.frequencyBinCount);
    freqAnalyser.getByteFrequencyData(frequency);

    const amplitude = computeAmplitude(timeDomain);
    const peak = computePeak(timeDomain);
    const bands = extractBands(frequency);
    const beat = beatDetectorRef.current.detect(amplitude);

    audioDataRef.current = { timeDomain, frequency, bands, amplitude, beat, peak };
  }, [isMock]);

  return {
    audioDataRef,
    update,
    startMic,
    loadFile,
    stop,
    sourceType,
    isActive,
    isMock,
    fileName,
  };
}
