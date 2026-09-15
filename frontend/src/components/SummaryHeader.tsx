import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { DriverLapSummary } from '../types/telemetry';

interface SummaryHeaderProps {
  driver1: DriverLapSummary;
  driver2: DriverLapSummary;
  delta?: number;
  fasterDriver: string;
  year: number | string;
  gp: string;
  session: string;
  trackLength: number;
  trackTemp?: number | null;
  airTemp?: number | null;
}

export const SummaryHeader: React.FC<SummaryHeaderProps> = ({
  driver1,
  driver2,
  delta: _delta,
  fasterDriver,
  year: _year,
  gp: _gp,
  session: _session,
  trackLength: _trackLength,
  trackTemp,
  airTemp,
}) => {
  const isD1Faster = driver1.lap_time_seconds <= driver2.lap_time_seconds;
  const absDelta = Math.abs(driver1.lap_time_seconds - driver2.lap_time_seconds).toFixed(3);

  const formatTyreString = (drv: DriverLapSummary) => {
    const c = (drv.tyre || 'S').toUpperCase();
    const shortCode = c.includes('MED') ? 'M' : c.includes('HARD') ? 'H' : c.includes('INTER') ? 'I' : c.includes('WET') ? 'W' : 'S';
    const ageStr = drv.tyre_age !== undefined && drv.tyre_age !== null ? `${drv.tyre_age}L` : '';
    const freshStr = drv.fresh_tyre ? 'NEW' : 'USED';
    return `${shortCode} [${freshStr} ${ageStr}]`.trim();
  };

  return (
    <div className="p-1 bg-transparent text-[10px] font-mono leading-tight space-y-1 select-none">
      {/* Driver 1 Telemetry Line */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-1 rounded-xs bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: driver1.team_color }}
          />
          <span className="font-bold text-white text-xs font-mono">{driver1.code}</span>
          <span className="text-slate-500 font-mono text-[9.5px]">#{driver1.number}</span>
          <span
            className="font-bold font-mono text-white text-xs"
            style={{ color: driver1.team_color }}
          >
            {driver1.lap_time}
          </span>
          {isD1Faster && (
            <span className="text-[8.5px] font-bold text-[#00E676] bg-[#00E676]/10 px-1 py-0.2 rounded-xs border border-[#00E676]/30">
              P1
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[9.5px]">
          <span className="text-slate-400 font-mono bg-white/5 px-1 py-0.2 rounded-xs">
            TYRE: <span className="text-amber-300 font-bold">{formatTyreString(driver1)}</span>
          </span>
          {driver1.top_speed && (
            <span className="text-slate-400">
              VMAX: <strong className="text-white">{driver1.top_speed}</strong>
            </span>
          )}
          {(driver1.s1 || driver1.s2 || driver1.s3) && (
            <span className="text-slate-500 hidden sm:inline">
              S1: <span className="text-slate-300">{driver1.s1 || '--'}</span> S2: <span className="text-slate-300">{driver1.s2 || '--'}</span> S3: <span className="text-slate-300">{driver1.s3 || '--'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: Lap Delta & Weather Temperatures Strip */}
      <div className="flex items-center justify-between px-1.5 py-0.5 rounded-xs bg-white/[0.01] border border-white/[0.04] text-[9.5px]">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold">DELTA:</span>
          <span
            className={`font-mono font-bold flex items-center gap-0.5 ${
              isD1Faster ? 'text-[#00E676]' : 'text-[#FF1744]'
            }`}
          >
            {isD1Faster ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {isD1Faster ? `-${absDelta}s` : `+${absDelta}s`}
          </span>
          <span className="text-slate-400 font-mono">({fasterDriver})</span>
        </div>

        <div className="flex items-center gap-2">
          {(trackTemp !== undefined && trackTemp !== null) && (
            <span className="text-slate-400">
              TRACK: <strong className="text-red-400">{trackTemp}°C</strong>
            </span>
          )}
          {(airTemp !== undefined && airTemp !== null) && (
            <span className="text-slate-400">
              AIR: <strong className="text-cyan-300">{airTemp}°C</strong>
            </span>
          )}
        </div>
      </div>

      {/* Driver 2 Telemetry Line */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-1 rounded-xs bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: driver2.team_color }}
          />
          <span className="font-bold text-white text-xs font-mono">{driver2.code}</span>
          <span className="text-slate-500 font-mono text-[9.5px]">#{driver2.number}</span>
          <span
            className="font-bold font-mono text-white text-xs"
            style={{ color: driver2.team_color }}
          >
            {driver2.lap_time}
          </span>
          {(!isD1Faster) && (
            <span className="text-[8.5px] font-bold text-[#00E676] bg-[#00E676]/10 px-1 py-0.2 rounded-xs border border-[#00E676]/30">
              P1
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[9.5px]">
          <span className="text-slate-400 font-mono bg-white/5 px-1 py-0.2 rounded-xs">
            TYRE: <span className="text-amber-300 font-bold">{formatTyreString(driver2)}</span>
          </span>
          {driver2.top_speed && (
            <span className="text-slate-400">
              VMAX: <strong className="text-white">{driver2.top_speed}</strong>
            </span>
          )}
          {(driver2.s1 || driver2.s2 || driver2.s3) && (
            <span className="text-slate-500 hidden sm:inline">
              S1: <span className="text-slate-300">{driver2.s1 || '--'}</span> S2: <span className="text-slate-300">{driver2.s2 || '--'}</span> S3: <span className="text-slate-300">{driver2.s3 || '--'}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
