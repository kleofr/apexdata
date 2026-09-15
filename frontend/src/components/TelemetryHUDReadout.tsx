import React from 'react';
import { TelemetryPoint, DriverLapSummary, CornerMarker } from '../types/telemetry';

interface TelemetryHUDReadoutProps {
  currentPoint: TelemetryPoint | null;
  driver1: DriverLapSummary;
  driver2: DriverLapSummary;
  trackLength: number;
  d1Color: string;
  d2Color: string;
  corners?: CornerMarker[];
}

export const TelemetryHUDReadout: React.FC<TelemetryHUDReadoutProps> = ({
  currentPoint,
  driver1,
  driver2,
  trackLength,
  d1Color,
  d2Color,
  corners = [],
}) => {
  if (!currentPoint) {
    return (
      <div className="bg-transparent px-1.5 py-0.5 border-t border-white/[0.06] flex items-center justify-between text-[9.5px] font-mono text-slate-500">
        <span>SCRUB OVER TRACE OR CIRCUIT MAP TO INSPECT CHANNELS</span>
        <span>{driver1.code} vs {driver2.code}</span>
      </div>
    );
  }

  const speedDiff = Math.round((currentPoint.speed1 - currentPoint.speed2) * 10) / 10;
  const isD1SpeedHigher = speedDiff >= 0;

  // Find nearest turn
  let activeTurn: CornerMarker | null = null;
  if (corners.length > 0) {
    const dist = currentPoint.distance;
    const sorted = [...corners].sort(
      (a, b) => Math.abs(a.distance - dist) - Math.abs(b.distance - dist)
    );
    if (sorted[0] && Math.abs(sorted[0].distance - dist) < 120) {
      activeTurn = sorted[0];
    }
  }

  return (
    <div className="bg-transparent px-1.5 py-0.5 border-t border-white/[0.06] text-[9.5px] font-mono leading-tight space-y-0.5 select-none">
      {/* Top Line: Distance, Turn Badge, and Live Delta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-bold">DIST:</span>
          <strong className="text-white font-mono text-[11px]">{Math.round(currentPoint.distance)}m</strong>
          <span className="text-slate-600">({Math.round((currentPoint.distance / trackLength) * 100)}%)</span>

          {activeTurn && (
            <span className="text-[#FF6A00] font-bold bg-[#FF6A00]/15 border border-[#FF6A00]/30 px-1.5 py-0.2 rounded font-mono text-[10px]">
              T{activeTurn.number}{activeTurn.letter || ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold">d-T:</span>
          <span
            className={`font-mono font-bold ${
              currentPoint.delta <= 0 ? 'text-[#00E676]' : 'text-[#FF1744]'
            }`}
          >
            {currentPoint.delta <= 0
              ? `${currentPoint.delta.toFixed(3)}s (${driver1.code})`
              : `+${currentPoint.delta.toFixed(3)}s (${driver2.code})`}
          </span>
        </div>
      </div>

      {/* Bottom Line: Cleanly Grouped Telemetry Channels */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-0.5 border-t border-white/5 text-[10px]">
        {/* SPD */}
        <div className="flex items-center gap-1 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
          <span className="text-slate-500 font-bold">SPD:</span>
          <span className="font-bold font-mono" style={{ color: d1Color }}>{currentPoint.speed1}</span>
          <span className="text-slate-600">/</span>
          <span className="font-bold font-mono" style={{ color: d2Color }}>{currentPoint.speed2}</span>
          <span className={`text-[9px] ${isD1SpeedHigher ? 'text-[#00E676]' : 'text-[#FF1744]'}`}>
            ({isD1SpeedHigher ? `+${speedDiff}` : speedDiff})
          </span>
        </div>

        {/* THR */}
        <div className="flex items-center gap-1 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
          <span className="text-slate-500 font-bold">THR:</span>
          <span className="font-bold font-mono" style={{ color: d1Color }}>{Math.round(currentPoint.throttle1)}%</span>
          <span className="text-slate-600">/</span>
          <span className="font-bold font-mono" style={{ color: d2Color }}>{Math.round(currentPoint.throttle2)}%</span>
        </div>

        {/* BRK */}
        <div className="flex items-center gap-1 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
          <span className="text-slate-500 font-bold">BRK:</span>
          <span className={currentPoint.brake1 > 0 ? 'text-red-400 font-bold font-mono' : 'text-slate-500 font-mono'}>
            {currentPoint.brake1 > 0 ? `${Math.round(currentPoint.brake1)}%` : '0'}
          </span>
          <span className="text-slate-600">/</span>
          <span className={currentPoint.brake2 > 0 ? 'text-red-400 font-bold font-mono' : 'text-slate-500 font-mono'}>
            {currentPoint.brake2 > 0 ? `${Math.round(currentPoint.brake2)}%` : '0'}
          </span>
        </div>

        {/* GEAR */}
        <div className="flex items-center gap-1 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
          <span className="text-slate-500 font-bold">GEAR:</span>
          <span className="font-bold font-mono" style={{ color: d1Color }}>G{currentPoint.gear1}</span>
          <span className="text-slate-600">/</span>
          <span className="font-bold font-mono" style={{ color: d2Color }}>G{currentPoint.gear2}</span>
        </div>

        {/* RPM */}
        <div className="flex items-center gap-1 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
          <span className="text-slate-500 font-bold">RPM:</span>
          <span className="font-mono text-slate-300">{currentPoint.rpm1}</span>
          <span className="text-slate-600">/</span>
          <span className="font-mono text-slate-300">{currentPoint.rpm2}</span>
        </div>

        {/* STR */}
        <div className="flex items-center gap-1 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
          <span className="text-slate-500 font-bold">STR:</span>
          <span className="font-mono" style={{ color: d1Color }}>{currentPoint.steering1.toFixed(1)}°</span>
          <span className="text-slate-600">/</span>
          <span className="font-mono" style={{ color: d2Color }}>{currentPoint.steering2.toFixed(1)}°</span>
        </div>
      </div>
    </div>
  );
};
