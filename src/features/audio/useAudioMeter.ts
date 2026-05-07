import { useCallback, useEffect, useRef, useState } from "react";

interface AudioMeterState {
  active: boolean;
  mode: "idle" | "microphone" | "file";
  level: number;
  error: string;
}

const initialState: AudioMeterState = {
  active: false,
  mode: "idle",
  level: 0,
  error: "",
};

export function useAudioMeter() {
  const [state, setState] = useState<AudioMeterState>(initialState);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef("");
  const intervalRef = useRef(0);

  const sample = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) {
      return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const weighted = data.reduce((sum, value, index) => {
      const emphasis = index < data.length * 0.35 ? 1.2 : 0.65;
      return sum + value * emphasis;
    }, 0);
    const level = Math.min(1, weighted / (data.length * 255));
    setState((current) => ({ ...current, level }));
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = 0;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRef.current?.pause();
    mediaRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
    void contextRef.current?.close();
    contextRef.current = null;
    analyserRef.current = null;
    setState(initialState);
  }, []);

  const createAnalyser = useCallback(() => {
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.82;
    contextRef.current = context;
    analyserRef.current = analyser;
    return { analyser, context };
  }, []);

  const startMicrophone = useCallback(async () => {
    stop();
    try {
      const { analyser, context } = createAnalyser();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      streamRef.current = stream;
      setState({ active: true, mode: "microphone", level: 0, error: "" });
      sample();
      intervalRef.current = window.setInterval(sample, 50);
    } catch (error) {
      setState({
        active: false,
        mode: "idle",
        level: 0,
        error:
          error instanceof Error
            ? error.message
            : "Microphone could not start.",
      });
    }
  }, [createAnalyser, sample, stop]);

  const loadFile = useCallback(
    async (file: File) => {
      stop();
      try {
        const { analyser, context } = createAnalyser();
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(file);
        objectUrlRef.current = objectUrl;
        audio.src = objectUrl;
        audio.loop = true;
        audio.crossOrigin = "anonymous";
        const source = context.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(context.destination);
        mediaRef.current = audio;
        await audio.play();
        setState({ active: true, mode: "file", level: 0, error: "" });
        sample();
        intervalRef.current = window.setInterval(sample, 50);
      } catch (error) {
        setState({
          active: false,
          mode: "idle",
          level: 0,
          error:
            error instanceof Error
              ? error.message
              : "Audio file could not be analyzed.",
        });
      }
    },
    [createAnalyser, sample, stop],
  );

  useEffect(() => stop, [stop]);

  return {
    ...state,
    loadFile,
    startMicrophone,
    stop,
  };
}
