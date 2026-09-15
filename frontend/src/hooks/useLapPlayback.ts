import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ComparisonData, TelemetryPoint, PlaybackMode, PlaybackSpeed } from '../types/telemetry';

export interface UseLapPlaybackOptions {
  data: ComparisonData | null;
  onPointChange: (point: TelemetryPoint | null) => void;
}

export interface UseLapPlaybackReturn {
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  playbackMode: PlaybackMode;
  currentDistance: number;
  currentElapsedTime: number;
  totalLapTime: number;
  progressPercent: number;
  currentIndex: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setMode: (mode: PlaybackMode) => void;
  seekDistance: (distance: number) => void;
  seekFraction: (fraction: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
}

export function useLapPlayback({ data, onPointChange }: UseLapPlaybackOptions): UseLapPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('time_accurate');
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const telemetry = data?.telemetry || [];
  const trackLength = data?.summary.track_length || (telemetry.length > 0 ? telemetry[telemetry.length - 1].distance : 5000);

  // Precompute elapsed time array (in seconds) for each telemetry sample
  const { sampleTimes, totalLapTime } = useMemo(() => {
    if (!telemetry || telemetry.length < 2) {
      return { sampleTimes: [], totalLapTime: 0 };
    }

    const times: number[] = [0];
    let accumulatedTime = 0;

    for (let i = 1; i < telemetry.length; i++) {
      const pPrev = telemetry[i - 1];
      const pCurr = telemetry[i];
      const distDelta = Math.max(0, pCurr.distance - pPrev.distance);

      // Convert speed from km/h to m/s
      const avgSpeedMs = Math.max(5, ((pPrev.speed1 + pCurr.speed1) / 2) * (1000 / 3600));
      const dt = distDelta / avgSpeedMs;
      accumulatedTime += dt;
      times.push(accumulatedTime);
    }

    // Calibrate to official lap time if available
    const officialSeconds = data?.driver1.lap_time_seconds;
    if (officialSeconds && officialSeconds > 10 && accumulatedTime > 0) {
      const scale = officialSeconds / accumulatedTime;
      for (let i = 0; i < times.length; i++) {
        times[i] *= scale;
      }
      return { sampleTimes: times, totalLapTime: officialSeconds };
    }

    return { sampleTimes: times, totalLapTime: accumulatedTime };
  }, [telemetry, data?.driver1.lap_time_seconds]);

  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  const speedRef = useRef<PlaybackSpeed>(playbackSpeed);
  speedRef.current = playbackSpeed;

  const modeRef = useRef<PlaybackMode>(playbackMode);
  modeRef.current = playbackMode;

  const currentIndexRef = useRef<number>(currentIndex);
  currentIndexRef.current = currentIndex;

  const currentTimeRef = useRef<number>(0);
  const currentDistanceRef = useRef<number>(0);

  const lastFrameTimestampRef = useRef<number | null>(null);
  const rAfIdRef = useRef<number | null>(null);

  // Update refs when index changes externally
  useEffect(() => {
    if (telemetry.length > 0 && currentIndex < telemetry.length) {
      currentDistanceRef.current = telemetry[currentIndex].distance;
      if (sampleTimes.length > currentIndex) {
        currentTimeRef.current = sampleTimes[currentIndex];
      }
    }
  }, [currentIndex, telemetry, sampleTimes]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (rAfIdRef.current !== null) {
      cancelAnimationFrame(rAfIdRef.current);
      rAfIdRef.current = null;
    }
    lastFrameTimestampRef.current = null;
  }, []);

  const play = useCallback(() => {
    if (!telemetry || telemetry.length < 2) return;

    // If at or near the end, restart from beginning
    if (currentIndexRef.current >= telemetry.length - 1) {
      currentIndexRef.current = 0;
      currentTimeRef.current = 0;
      currentDistanceRef.current = telemetry[0].distance;
      setCurrentIndex(0);
      onPointChange(telemetry[0]);
    }

    setIsPlaying(true);
    lastFrameTimestampRef.current = null;
  }, [telemetry, onPointChange]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  const seekDistance = useCallback((targetDistance: number) => {
    if (!telemetry || telemetry.length === 0) return;
    pause();

    const clampedDist = Math.max(0, Math.min(trackLength, targetDistance));
    
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < telemetry.length; i++) {
      const diff = Math.abs(telemetry[i].distance - clampedDist);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    currentIndexRef.current = closestIdx;
    currentDistanceRef.current = telemetry[closestIdx].distance;
    if (sampleTimes.length > closestIdx) {
      currentTimeRef.current = sampleTimes[closestIdx];
    }
    setCurrentIndex(closestIdx);
    onPointChange(telemetry[closestIdx]);
  }, [telemetry, trackLength, sampleTimes, pause, onPointChange]);

  const seekFraction = useCallback((fraction: number) => {
    const targetDist = fraction * trackLength;
    seekDistance(targetDist);
  }, [trackLength, seekDistance]);

  const stepForward = useCallback(() => {
    if (!telemetry || telemetry.length === 0) return;
    pause();
    const nextIdx = Math.min(telemetry.length - 1, currentIndexRef.current + 1);
    currentIndexRef.current = nextIdx;
    currentDistanceRef.current = telemetry[nextIdx].distance;
    if (sampleTimes.length > nextIdx) {
      currentTimeRef.current = sampleTimes[nextIdx];
    }
    setCurrentIndex(nextIdx);
    onPointChange(telemetry[nextIdx]);
  }, [telemetry, sampleTimes, pause, onPointChange]);

  const stepBackward = useCallback(() => {
    if (!telemetry || telemetry.length === 0) return;
    pause();
    const prevIdx = Math.max(0, currentIndexRef.current - 1);
    currentIndexRef.current = prevIdx;
    currentDistanceRef.current = telemetry[prevIdx].distance;
    if (sampleTimes.length > prevIdx) {
      currentTimeRef.current = sampleTimes[prevIdx];
    }
    setCurrentIndex(prevIdx);
    onPointChange(telemetry[prevIdx]);
  }, [telemetry, sampleTimes, pause, onPointChange]);

  // Main animation loop driven by requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || !telemetry || telemetry.length < 2) {
      if (rAfIdRef.current !== null) {
        cancelAnimationFrame(rAfIdRef.current);
        rAfIdRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (lastFrameTimestampRef.current === null) {
        lastFrameTimestampRef.current = timestamp;
      }

      const elapsedDeltaSec = (timestamp - lastFrameTimestampRef.current) / 1000;
      lastFrameTimestampRef.current = timestamp;

      // Cap delta time to 0.1s to avoid huge jumps
      const safeDeltaSec = Math.min(elapsedDeltaSec, 0.1) * speedRef.current;

      if (modeRef.current === 'time_accurate') {
        currentTimeRef.current += safeDeltaSec;

        if (currentTimeRef.current >= totalLapTime) {
          const lastIdx = telemetry.length - 1;
          currentIndexRef.current = lastIdx;
          currentTimeRef.current = totalLapTime;
          currentDistanceRef.current = telemetry[lastIdx].distance;
          setCurrentIndex(lastIdx);
          onPointChange(telemetry[lastIdx]);
          pause();
          return;
        }

        let low = 0;
        let high = sampleTimes.length - 1;
        const targetTime = currentTimeRef.current;

        while (low <= high) {
          const mid = (low + high) >> 1;
          if (sampleTimes[mid] < targetTime) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        const newIdx = Math.min(telemetry.length - 1, Math.max(0, low));
        if (newIdx !== currentIndexRef.current) {
          currentIndexRef.current = newIdx;
          currentDistanceRef.current = telemetry[newIdx].distance;
          setCurrentIndex(newIdx);
          onPointChange(telemetry[newIdx]);
        }
      } else {
        const avgSpeedMs = totalLapTime > 0 ? trackLength / totalLapTime : 60;
        currentDistanceRef.current += avgSpeedMs * safeDeltaSec;

        if (currentDistanceRef.current >= trackLength) {
          const lastIdx = telemetry.length - 1;
          currentIndexRef.current = lastIdx;
          currentDistanceRef.current = trackLength;
          if (sampleTimes.length > lastIdx) {
            currentTimeRef.current = sampleTimes[lastIdx];
          }
          setCurrentIndex(lastIdx);
          onPointChange(telemetry[lastIdx]);
          pause();
          return;
        }

        let low = 0;
        let high = telemetry.length - 1;
        const targetDist = currentDistanceRef.current;

        while (low <= high) {
          const mid = (low + high) >> 1;
          if (telemetry[mid].distance < targetDist) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        const newIdx = Math.min(telemetry.length - 1, Math.max(0, low));
        if (newIdx !== currentIndexRef.current) {
          currentIndexRef.current = newIdx;
          if (sampleTimes.length > newIdx) {
            currentTimeRef.current = sampleTimes[newIdx];
          }
          setCurrentIndex(newIdx);
          onPointChange(telemetry[newIdx]);
        }
      }

      rAfIdRef.current = requestAnimationFrame(animate);
    };

    rAfIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rAfIdRef.current !== null) {
        cancelAnimationFrame(rAfIdRef.current);
        rAfIdRef.current = null;
      }
    };
  }, [isPlaying, telemetry, sampleTimes, totalLapTime, trackLength, onPointChange, pause]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepBackward();
      } else if (e.code === 'Home') {
        e.preventDefault();
        seekFraction(0);
      } else if (e.code === 'End') {
        e.preventDefault();
        seekFraction(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepForward, stepBackward, seekFraction]);

  const currentDistance = telemetry[currentIndex]?.distance || 0;
  const currentElapsedTime = sampleTimes[currentIndex] || 0;
  const progressPercent = trackLength > 0 ? (currentDistance / trackLength) * 100 : 0;

  return {
    isPlaying,
    playbackSpeed,
    playbackMode,
    currentDistance,
    currentElapsedTime,
    totalLapTime,
    progressPercent,
    currentIndex,
    play,
    pause,
    togglePlay,
    setSpeed: setPlaybackSpeed,
    setMode: setPlaybackMode,
    seekDistance,
    seekFraction,
    stepForward,
    stepBackward,
  };
}
