import React, { useEffect, useState } from 'react';
import { Activity, Radio } from 'lucide-react';

interface LoadingBootScreenProps {
  message?: string;
  submessage?: string;
}

const BOOT_LOGS = [
  'INITIALIZING FASTF1 PROTOCOL BUFFER...',
  'CONNECTING TO FIA TELEMETRY FEED...',
  'RESOLVING CAR TELEMETRY CHANNELS (RPM, SPEED, THROTTLE, BRAKE)...',
  'SYNCHRONIZING POSITION CHANNELS (X, Y, Z, STEERING)...',
  'COMPUTING DISTANCE-BASED NORMALIZATION GRID (0.1m RESOLUTION)...',
  'CALCULATING HEAD-TO-HEAD INSTANTANEOUS DELTA TRACE...',
  'LOCKING MULTI-CHART CROSSHAIR PIPELINE AT 50HZ...',
];

export const LoadingBootScreen: React.FC<LoadingBootScreenProps> = ({
  message = 'ACQUIRING PER-LAP TELEMETRY DATA...',
  submessage = 'Streaming high-frequency timing and car sensors from FastF1 session cache',
}) => {
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogIndex((prev) => (prev < BOOT_LOGS.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hud-panel p-8 rounded-md border border-[#FF6A00]/40 bg-[#10131B]/95 shadow-neon-orange my-6 relative overflow-hidden">
      {/* Radar scanning beam */}
      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#FF6A00] to-transparent animate-scanline pointer-events-none"></div>

      <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
        {/* Animated F1 Telemetry Beacon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/60 flex items-center justify-center animate-pulse-glow">
            <Activity className="w-8 h-8 text-[#FF6A00] animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00E676] border-2 border-[#10131B] flex items-center justify-center">
            <Radio className="w-2.5 h-2.5 text-black animate-spin" />
          </div>
        </div>

        {/* Title & Status */}
        <h3 className="font-orbitron font-extrabold text-lg sm:text-xl text-white tracking-widest uppercase mb-2">
          {message}
        </h3>
        <p className="text-sm font-rajdhani text-slate-400 max-w-lg mb-6">
          {submessage}
        </p>

        {/* Telemetry Diagnostic Stream */}
        <div className="w-full bg-[#090B10] border border-white/10 rounded p-3 font-mono text-[11px] text-left max-h-36 overflow-hidden">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/10 text-[10px] text-slate-500">
            <span>SYS_DIAGNOSTICS // STREAM ACTIVE</span>
            <span className="text-[#00E676]">CONNECTED</span>
          </div>
          <div className="space-y-1">
            {BOOT_LOGS.slice(0, logIndex + 1).map((log, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 ${
                  i === logIndex ? 'text-[#FF6A00] font-bold' : 'text-slate-400'
                }`}
              >
                <span className="text-slate-600">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
