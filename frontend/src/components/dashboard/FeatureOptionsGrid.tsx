import React from 'react';
import { Activity, Flame, Layers, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface FeatureOptionsGridProps {
  onLaunchTelemetry: () => void;
  onLaunchQualifyingDelta?: () => void;
}

export const FeatureOptionsGrid: React.FC<FeatureOptionsGridProps> = ({
  onLaunchTelemetry,
  onLaunchQualifyingDelta,
}) => {

  const { theme } = useTheme();

  return (
    <div className="h-full flex flex-col bg-[#090B10] border border-white/10 rounded overflow-hidden select-none font-mono text-xs">
      {/* Header */}
      <div className="px-3 py-1.5 bg-[#0E1118] border-b border-white/10 flex items-center justify-between shrink-0">
        <span className="font-orbitron font-bold text-[11px] text-white tracking-wider uppercase">
          ANALYSIS WORKSPACES & MODULES
        </span>
        <span className="text-[10px] text-slate-400">SELECT FEATURE</span>
      </div>

      {/* Feature Cards Grid */}
      <div className="p-2 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 overflow-hidden">
        {/* Module 1: Telemetry Workbench (Active) */}
        <button
          onClick={onLaunchTelemetry}
          className="p-2.5 rounded border border-white/20 bg-white/5 hover:bg-white/10 transition-all flex flex-col justify-between text-left group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: `${theme.primaryColor}22`, color: theme.primaryColor }}
              >
                <Activity className="w-3.5 h-3.5" />
              </span>
              <span
                className="text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase"
                style={{
                  backgroundColor: `${theme.primaryColor}22`,
                  color: theme.primaryColor,
                  borderColor: `${theme.primaryColor}44`
                }}
              >
                READY
              </span>
            </div>
            <div className="font-bold text-white font-orbitron text-xs group-hover:text-white">
              LAP TELEMETRY COMPARISON
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Compare fastest laps between any two drivers with synchronized playback, delta map, speed, and throttle traces.
            </div>
          </div>

          <div
            className="flex items-center gap-1 font-bold text-[10px] pt-2 mt-2 border-t border-white/5"
            style={{ color: theme.primaryColor }}
          >
            <span>LAUNCH MODULE</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Module 2: Qualifying Delta (Active) */}
        <button
          onClick={onLaunchQualifyingDelta}
          className="p-2.5 rounded border border-white/20 bg-white/5 hover:bg-white/10 transition-all flex flex-col justify-between text-left group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span
                className="w-6 h-6 rounded flex items-center justify-center bg-amber-400/20 text-amber-400"
              >
                <Layers className="w-3.5 h-3.5" />
              </span>
              <span
                className="text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase bg-amber-400/20 text-amber-300 border-amber-400/40"
              >
                READY
              </span>
            </div>
            <div className="font-bold text-white font-orbitron text-xs group-hover:text-white">
              QUALIFYING DELTA BENCHMARK
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Sector time breakdown, theoretical best lap, and corner-level telemetry compared against pole.
            </div>
          </div>

          <div
            className="flex items-center gap-1 font-bold text-[10px] pt-2 mt-2 border-t border-white/5 text-amber-400"
          >
            <span>LAUNCH MODULE</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>


        {/* Module 3: Tyre & Stint Strategy (Upcoming) */}
        <div className="p-2.5 rounded border border-white/5 bg-white/[0.02] flex flex-col justify-between opacity-60">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="w-6 h-6 rounded flex items-center justify-center bg-white/5 text-slate-400">
                <Flame className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/5 text-slate-400 uppercase">
                UPCOMING
              </span>
            </div>
            <div className="font-bold text-slate-300 font-orbitron text-xs">
              TYRE DEGRADATION & STINTS
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Compound degradation curves, pit window crossovers, and degradation modeling.
            </div>
          </div>
          <div className="text-[9px] text-slate-500 pt-2 border-t border-white/5">
            FEATURE MODULE #03
          </div>
        </div>
      </div>
    </div>
  );
};
