import React, { useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Gauge, Zap } from 'lucide-react';
import { PlaybackMode, PlaybackSpeed } from '../types/telemetry';

interface PlaybackControlsProps {
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  playbackMode: PlaybackMode;
  currentDistance: number;
  currentElapsedTime: number;
  totalLapTime: number;
  trackLength: number;
  progressPercent: number;
  d1Code: string;
  d2Code: string;
  d1Color: string;
  d2Color: string;
  onTogglePlay: () => void;
  onSetSpeed: (speed: PlaybackSpeed) => void;
  onSetMode: (mode: PlaybackMode) => void;
  onSeekFraction: (fraction: number) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  playbackSpeed,
  playbackMode,
  currentDistance,
  currentElapsedTime,
  totalLapTime,
  trackLength,
  progressPercent,
  d1Code: _d1Code,
  d2Code: _d2Code,
  d1Color,
  d2Color: _d2Color,
  onTogglePlay,
  onSetSpeed,
  onSetMode,
  onSeekFraction,
  onStepForward,
  onStepBackward,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [hoverScrubDistance, setHoverScrubDistance] = useState<number | null>(null);
  const [hoverPositionX, setHoverPositionX] = useState<number | null>(null);

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec) || sec < 0) return '00:00.000';
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    const wholeSecs = Math.floor(remainder);
    const ms = Math.floor((remainder - wholeSecs) * 1000);
    const mStr = String(mins).padStart(2, '0');
    const sStr = String(wholeSecs).padStart(2, '0');
    const msStr = String(ms).padStart(3, '0');
    return mStr + ':' + sStr + '.' + msStr;
  };

  const calculateFractionFromEvent = (e: React.MouseEvent<HTMLDivElement> | MouseEvent): number => {
    if (!progressBarRef.current) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const frac = Math.max(0, Math.min(1, clickX / rect.width));
    return frac;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    const frac = calculateFractionFromEvent(e);
    onSeekFraction(frac);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const moveFrac = calculateFractionFromEvent(moveEvent);
      onSeekFraction(moveFrac);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMoveProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || trackLength <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frac = Math.max(0, Math.min(1, x / rect.width));
    setHoverScrubDistance(Math.round(frac * trackLength));
    setHoverPositionX(x);
  };

  const handleMouseLeaveProgress = () => {
    if (!isScrubbing) {
      setHoverScrubDistance(null);
      setHoverPositionX(null);
    }
  };

  const speeds: PlaybackSpeed[] = [0.5, 1, 2, 4];

  return (
    <div className="bg-transparent px-2 py-0.5 flex flex-col gap-0.5 select-none font-mono text-[10px]">
      {/* Upper Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        {/* Left: Transport Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onStepBackward}
            title="Step Backward 1 Sample (Left Arrow)"
            className="p-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause Replay (Space)' : 'Play Lap Replay (Space)'}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded font-bold font-orbitron text-[10px] tracking-wider transition-colors cursor-pointer border ${
              isPlaying
                ? 'bg-[#FF6A00] text-black border-[#FF6A00] hover:bg-[#ff8126]'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>PLAY</span>
              </>
            )}
          </button>

          <button
            onClick={onStepForward}
            title="Step Forward 1 Sample (Right Arrow)"
            className="p-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSeekFraction(0)}
            title="Reset to Lap Start (Home)"
            className="p-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Center-Left: Speed Multiplier Pills */}
        <div className="flex items-center gap-0.5 bg-black/40 p-0.5 rounded border border-white/5">
          <span className="text-slate-500 text-[9px] px-1 font-bold">SPD</span>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                playbackSpeed === s
                  ? 'bg-white/20 text-[#00F0FF] border border-[#00F0FF]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Center-Right: Replay Mode Toggle */}
        <div className="flex items-center gap-0.5 bg-black/40 p-0.5 rounded border border-white/5 text-[9px]">
          <button
            onClick={() => onSetMode('time_accurate')}
            title="Pace-accurate replay based on driver telemetry speeds and braking zones"
            className={`flex items-center gap-1 px-1.5 py-0.2 rounded transition-colors cursor-pointer ${
              playbackMode === 'time_accurate'
                ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-2.5 h-2.5" />
            <span>REAL-TIME PACE</span>
          </button>
          <button
            onClick={() => onSetMode('constant_speed')}
            title="Linear constant meters-per-second track scrub"
            className={`flex items-center gap-1 px-1.5 py-0.2 rounded transition-colors cursor-pointer ${
              playbackMode === 'constant_speed'
                ? 'bg-[#FF6A00]/20 text-[#FF6A00] border border-[#FF6A00]/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gauge className="w-2.5 h-2.5" />
            <span>CONST SPEED</span>
          </button>
        </div>

        {/* Right: Telemetry Live Clock & Distance Readout */}
        <div className="flex items-center gap-2 text-[10px]">
          <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/5 font-mono">
            <span className="text-slate-400">TIME:</span>
            <span className="text-[#00F0FF] font-bold font-orbitron">{formatSeconds(currentElapsedTime)}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{formatSeconds(totalLapTime)}</span>
          </div>

          <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/5 font-mono">
            <span className="text-slate-400">DIST:</span>
            <span className="text-white font-bold font-orbitron">{Math.round(currentDistance)}m</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{Math.round(trackLength)}m</span>
            <span className="text-slate-500 font-bold">({Math.round(progressPercent)}%)</span>
          </div>
        </div>
      </div>

      {/* Lower Scrub / Seek Bar */}
      <div
        ref={progressBarRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveProgress}
        onMouseLeave={handleMouseLeaveProgress}
        className="relative h-4 bg-black/70 rounded border border-white/10 cursor-pointer overflow-hidden group flex items-center"
      >
        {/* Track Sector Grid Background Lines */}
        <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20 px-2">
          <div className="w-px h-full bg-white"></div>
          <div className="w-px h-full bg-white"></div>
          <div className="w-px h-full bg-white"></div>
          <div className="w-px h-full bg-white"></div>
        </div>

        {/* Elapsed Progress Bar */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-white/10 via-[#FF6A00]/40 to-[#FF6A00]/90 pointer-events-none"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />

        {/* Current Playhead Scrubber Line & Dot */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-10 flex flex-col items-center justify-center -translate-x-1/2"
          style={{ left: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        >
          <div className="w-0.5 h-full bg-white shadow-[0_0_8px_#ffffff]"></div>
          <div
            className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-md absolute"
            style={{ backgroundColor: d1Color || '#FF6A00' }}
          ></div>
        </div>

        {/* Hover Scrub Preview Indicator */}
        {hoverPositionX !== null && hoverScrubDistance !== null && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center -translate-x-1/2"
            style={{ left: `${hoverPositionX}px` }}
          >
            <div className="w-px h-full bg-white/40 border-r border-dashed border-white/60"></div>
            <div className="absolute -top-5 bg-[#0E1118] border border-white/20 text-white font-mono text-[9px] px-1 py-0.2 rounded shadow-lg whitespace-nowrap">
              {hoverScrubDistance}m ({Math.round((hoverScrubDistance / (trackLength || 1)) * 100)}%)
            </div>
          </div>
        )}

        <div className="absolute left-2 text-[8px] font-mono text-slate-500 pointer-events-none z-0">
          START
        </div>
        <div className="absolute right-2 text-[8px] font-mono text-slate-500 pointer-events-none z-0">
          FINISH
        </div>
      </div>
    </div>
  );
};
