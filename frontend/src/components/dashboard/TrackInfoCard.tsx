import React from 'react';
import { Compass, RotateCw, Gauge } from 'lucide-react';
import { CircuitDetails } from '../../types/dashboard';
import { useTheme } from '../../context/ThemeContext';

interface TrackInfoCardProps {
  circuit: CircuitDetails;
  onOpenTelemetry?: () => void;
}

export const TrackInfoCard: React.FC<TrackInfoCardProps> = ({ circuit }) => {
  const { theme } = useTheme();

  return (
    <div className="h-full flex flex-col bg-[#090B10] border border-white/10 rounded overflow-hidden select-none font-mono text-xs">
      {/* Header */}
      <div className="px-3 py-1.5 bg-[#0E1118] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5" style={{ color: theme.secondaryColor }} />
          <span className="font-orbitron font-bold text-[11px] text-white tracking-wider uppercase">
            {circuit.name}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {circuit.location}
        </span>
      </div>

      {/* Body Specs */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2 overflow-hidden">
        {/* Stat badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
          <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold">CIRCUIT LENGTH</span>
            <span className="text-sm font-bold text-white font-orbitron">{circuit.length_km} KM</span>
          </div>
          <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold">CORNERS</span>
            <span className="text-sm font-bold text-white font-orbitron">{circuit.turns} TURNS</span>
          </div>
          <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold">DRS OVERTAKE ZONES</span>
            <span className="text-sm font-bold font-orbitron" style={{ color: theme.secondaryColor }}>
              {circuit.drs_zones_count} ZONES
            </span>
          </div>
          <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold">DIRECTION</span>
            <span className="text-sm font-bold text-white font-orbitron flex items-center gap-1">
              <RotateCw className="w-3 h-3 text-slate-400" />
              {circuit.characteristics?.direction || 'Clockwise'}
            </span>
          </div>
        </div>

        {/* Fastest Lap Ever Display */}
        <div className="p-2.5 rounded bg-white/[0.02] border border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              ALL-TIME TRACK RECORD (FASTEST LAP EVER)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {circuit.fastest_lap_ever?.session || 'Official'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-black font-orbitron text-white">
                {circuit.fastest_lap_ever?.time || '1:10.166'}
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                {circuit.fastest_lap_ever?.driver} <span className="text-slate-500">({circuit.fastest_lap_ever?.team} - {circuit.fastest_lap_ever?.year})</span>
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-400 border-l border-white/10 pl-3">
              <div>RACE LAP RECORD:</div>
              <div className="text-xs font-bold text-white font-mono">
                {circuit.race_lap_record?.time || '1:12.909'}
              </div>
              <div className="text-[9px] text-slate-500">
                {circuit.race_lap_record?.driver} ({circuit.race_lap_record?.year})
              </div>
            </div>
          </div>
        </div>

        {/* DRS & Overtake Zones List */}
        <div className="flex-1 min-h-0 bg-black/40 border border-white/5 rounded p-2 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
            <Gauge className="w-3 h-3" style={{ color: theme.secondaryColor }} />
            DRS DETECTION & OVERTAKE ACTIVATION ZONES
          </div>
          <div className="space-y-1">
            {circuit.drs_zones && circuit.drs_zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between p-1.5 rounded bg-white/[0.02] border border-white/5 text-[10px]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="px-1 py-0.2 rounded font-bold text-[9px]"
                    style={{ backgroundColor: `${theme.secondaryColor}22`, color: theme.secondaryColor }}
                  >
                    ZONE {zone.id}
                  </span>
                  <span className="text-slate-300">
                    <strong className="text-slate-500 font-normal">DETECTION:</strong> {zone.detection}
                  </span>
                </div>
                <div className="text-slate-400 truncate max-w-[200px]">
                  <strong className="text-slate-500 font-normal">ACTIVATION:</strong> {zone.activation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
