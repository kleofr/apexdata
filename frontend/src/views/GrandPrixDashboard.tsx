import React, { useState } from 'react';
import { ShieldCheck, Activity, Gauge, Zap, Compass, CloudRain, Sun } from 'lucide-react';
import { WeekendOverviewResponse } from '../types/dashboard';
import { DashboardCircuitMap } from '../components/dashboard/DashboardCircuitMap';
import { GridResultsTable } from '../components/dashboard/GridResultsTable';
import { FiaDocumentsModal } from '../components/dashboard/FiaDocumentsModal';
import { QualifyingDeltaModal } from '../components/dashboard/QualifyingDeltaModal';
import { useTheme } from '../context/ThemeContext';

interface GrandPrixDashboardProps {
  overviewData: WeekendOverviewResponse['data'];
  year: number;
  gp: string;
  onLaunchTelemetry: (d1?: string, d2?: string) => void;
  onLaunchQualifyingDelta?: (driver?: string) => void;
  onOpenGate?: () => void;
}

export const GrandPrixDashboard: React.FC<GrandPrixDashboardProps> = ({
  overviewData,
  year,
  gp,
  onLaunchTelemetry,
  onLaunchQualifyingDelta,
}) => {
  const { theme } = useTheme();
  const [isFiaModalOpen, setIsFiaModalOpen] = useState<boolean>(false);
  const [fiaDocuments, setFiaDocuments] = useState<any[]>([]);
  const [isQualifyingDeltaOpen, setIsQualifyingDeltaOpen] = useState<boolean>(false);
  const [qualifyingDriver, setQualifyingDriver] = useState<string>('');



  const handleOpenFiaModal = async () => {
    setIsFiaModalOpen(true);
    if (fiaDocuments.length === 0) {
      try {
        const res = await fetch(`/api/fia-documents?year=${year}&gp=${encodeURIComponent(gp)}`);
        const json = await res.json();
        if (json.data && json.data.documents) {
          setFiaDocuments(json.data.documents);
        }
      } catch (err) {
        console.warn('Failed to load FIA documents:', err);
      }
    }
  };

  const circuit = overviewData.circuit;
  const fastestLapData = overviewData.fastest_lap_info;
  const weatherDays = [
    overviewData.weather?.friday,
    overviewData.weather?.saturday,
    overviewData.weather?.sunday,
  ].filter(Boolean);

  // Dynamic Pole & Race Lap resolution
  const poleLap = fastestLapData?.qualifying_fastest || {
    time: circuit.fastest_lap_ever?.time || '--:--.---',
    driver: circuit.fastest_lap_ever?.driver || 'Official Record',
    team: circuit.fastest_lap_ever?.team || 'Formula 1',
    session: circuit.fastest_lap_ever?.session || 'Qualifying',
    team_color: '#FFFFFF'
  };

  const raceFastestLap = fastestLapData?.race_fastest || {
    time: circuit.race_lap_record?.time || '--:--.---',
    driver: circuit.race_lap_record?.driver || 'Fastest Lap',
    team: circuit.race_lap_record?.team || 'Formula 1',
    session: 'Race',
    lap_number: null,
    team_color: '#FFFFFF'
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[#050608] text-slate-100 p-1 gap-1 select-none font-mono">
      {/* 3-COLUMN HERO CENTERSTAGE LAYOUT (Card-Less & Edge-to-Edge) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-1 overflow-hidden">
        
        {/* ========================================================= */}
        {/* LEFT TELEMETRY RAIL (Col 3 / ~25%): Specs, Records, Weather */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 h-full min-h-0 flex flex-col gap-1 overflow-hidden pr-0.5">
          
          {/* 1. CIRCUIT SPECIFICATIONS & TELEMETRY MATRIX */}
          <div className="shrink-0 pb-1.5 border-b border-white/[0.06]">
            <div className="flex items-center justify-between pb-1 mb-1">
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-300 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" style={{ color: theme.primaryColor }} />
                <span>CIRCUIT MATRIX</span>
              </div>
              <span className="text-[8.5px] text-slate-500 uppercase">{circuit.location}</span>
            </div>

            <div className="text-xs font-black font-orbitron text-white truncate mb-1.5">
              {circuit.name}
            </div>

            {/* High-density tabular grid matrix */}
            <div className="grid grid-cols-2 gap-1 font-mono text-[9.5px]">
              <div className="bg-white/[0.02] p-1 rounded-xs flex items-center justify-between">
                <span className="text-slate-500">LENGTH</span>
                <span className="font-bold text-white">{circuit.length_km} KM</span>
              </div>
              <div className="bg-white/[0.02] p-1 rounded-xs flex items-center justify-between">
                <span className="text-slate-500">CORNERS</span>
                <span className="font-bold text-white">{circuit.turns}</span>
              </div>
              <div className="bg-white/[0.02] p-1 rounded-xs flex items-center justify-between">
                <span className="text-slate-500">DRS ZONES</span>
                <span className="font-bold text-cyan-400">{circuit.drs_zones_count || 2}</span>
              </div>
              <div className="bg-white/[0.02] p-1 rounded-xs flex items-center justify-between">
                <span className="text-slate-500">DOWNFORCE</span>
                <span className="font-bold text-amber-300">{circuit.characteristics?.downforce || 'MED'}</span>
              </div>
              <div className="col-span-2 bg-white/[0.02] p-1 rounded-xs flex items-center justify-between">
                <span className="text-slate-500">PIT LANE LOSS</span>
                <span className="font-bold text-slate-200">{circuit.characteristics?.pit_lane_loss_sec || 21.5}s <span className="text-slate-500 font-normal">DELTA</span></span>
              </div>
            </div>
          </div>

          {/* 2. FASTEST LAP TIMING INTELLIGENCE */}
          <div className="shrink-0 flex flex-col gap-1 pb-1.5 border-b border-white/[0.06]">
            <div className="flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-300 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" style={{ color: theme.secondaryColor }} />
                <span>TIMING BENCHMARKS</span>
              </div>
              <span className="text-[8.5px] text-slate-500">{year} {gp.toUpperCase()}</span>
            </div>

            {/* Qualifying / Pole Row */}
            <div
              onClick={() => {
                if (onLaunchQualifyingDelta) {
                  onLaunchQualifyingDelta();
                } else {
                  setQualifyingDriver('');
                  setIsQualifyingDeltaOpen(true);
                }
              }}
              title="Click to launch Qualifying Delta Analysis vs Pole"
              className="bg-white/[0.02] hover:bg-white/[0.05] p-1.5 rounded-xs flex flex-col justify-between cursor-pointer transition-colors group border border-transparent hover:border-amber-400/30"
            >
              <div className="flex items-center justify-between text-[8.5px] text-slate-400 mb-0.5">
                <span className="uppercase font-bold text-amber-300 flex items-center gap-1 group-hover:text-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  QUALIFYING POLE
                </span>
                <span className="font-mono text-[7.5px] px-1 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  DELTA ANALYSIS &rarr;
                </span>
              </div>
              <div className="text-base font-black font-orbitron text-white leading-tight">
                {poleLap.time}
              </div>
              <div className="text-[9.5px] text-slate-300 truncate mt-0.5 flex items-center gap-1">
                <span
                  className="w-1.5 h-2 rounded-xs shrink-0"
                  style={{ backgroundColor: poleLap.team_color || theme.primaryColor }}
                />
                <span className="font-bold text-white truncate">{poleLap.driver}</span>
                <span className="text-slate-500 truncate">({poleLap.team})</span>
              </div>
            </div>

            {/* Fastest Race Lap Row */}
            <div className="bg-white/[0.02] p-1.5 rounded-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[8.5px] text-slate-400 mb-0.5">
                <span className="uppercase font-bold text-cyan-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  FASTEST RACE LAP
                </span>
                <span className="font-mono text-slate-500 text-[8px]">
                  {raceFastestLap.lap_number ? `LAP ${raceFastestLap.lap_number}` : 'Race'}
                </span>
              </div>
              <div className="text-base font-black font-orbitron text-white leading-tight">
                {raceFastestLap.time}
              </div>
              <div className="text-[9.5px] text-slate-300 truncate mt-0.5 flex items-center gap-1">
                <span
                  className="w-1.5 h-2 rounded-xs shrink-0"
                  style={{ backgroundColor: raceFastestLap.team_color || '#00D2BE' }}
                />
                <span className="font-bold text-white truncate">{raceFastestLap.driver}</span>
                <span className="text-slate-500 truncate">({raceFastestLap.team})</span>
              </div>
            </div>
          </div>

          {/* 3. MICRO 3-DAY WEEKEND WEATHER STRIP */}
          <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden pt-0.5">
            <div className="flex items-center justify-between pb-0.5 shrink-0">
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-300 uppercase tracking-wider">
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                <span>3-DAY ATMOSPHERICS</span>
              </div>
              <span className="text-[8.5px] text-slate-500 font-mono">C° &bull; % RAIN</span>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-3 gap-1 overflow-hidden">
              {weatherDays.map((d: any) => {
                const isRainRisk = (d.rain_probability_pct || 0) >= 40;
                return (
                  <div
                    key={d.day}
                    className="bg-white/[0.02] p-1 rounded-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-0.5">
                      <span className="font-bold text-white text-[9.5px] uppercase font-orbitron">{d.day.slice(0, 3)}</span>
                      {isRainRisk ? (
                        <CloudRain className="w-3 h-3 text-cyan-400 shrink-0" />
                      ) : (
                        <Sun className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                    </div>

                    <div className="my-0.5 space-y-0.5 text-[8.5px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">TRK:</span>
                        <span className="font-bold text-red-400">{d.track_temp_c}°C</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">AIR:</span>
                        <span className="font-bold text-slate-200">{d.air_temp_c}°C</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">RAIN:</span>
                        <span className={`font-bold ${isRainRisk ? 'text-cyan-400' : 'text-slate-400'}`}>
                          {d.rain_probability_pct}%
                        </span>
                      </div>
                    </div>

                    <div className="text-[7.5px] text-slate-500 truncate pt-0.5 border-t border-white/[0.04]">
                      {d.sessions}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* CENTER STAGE (Col 6 / ~50%): Hero Circuit Track Map Canvas */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 h-full min-h-0 flex flex-col overflow-hidden border-x border-white/[0.06]">
          <DashboardCircuitMap
            circuit={circuit}
            trackGeometry={overviewData.track_geometry}
          />
        </div>

        {/* ========================================================= */}
        {/* RIGHT TELEMETRY RAIL (Col 3 / ~25%): Actions & Grid Results */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 h-full min-h-0 flex flex-col gap-1 overflow-hidden pl-0.5">
          
          {/* 1. PIT-WALL ACTION DOCK */}
          <div className="shrink-0 flex flex-col gap-1 pb-1 border-b border-white/[0.06]">
            <button
              onClick={() => onLaunchTelemetry('LEC', 'NOR')}
              title="Launch Dual Driver Synchronized Telemetry Workbench"
              className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-xs border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>COMPARE TELEMETRY</span>
            </button>

            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => {
                  if (onLaunchQualifyingDelta) {
                    onLaunchQualifyingDelta();
                  } else {
                    setQualifyingDriver('');
                    setIsQualifyingDeltaOpen(true);
                  }
                }}
                title="Qualifying Sector Time Breakdown & Pole Deltas Workbench"
                className="col-span-2 flex items-center justify-center gap-1.5 py-1 px-2 rounded-xs border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[9.5px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>QUALIFYING DELTA WORKBENCH</span>
              </button>

              <button
                onClick={handleOpenFiaModal}
                title="View Official FIA Technical Regulations & Decisions"
                className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-xs border transition-colors cursor-pointer text-[9.5px] font-bold tracking-wider uppercase"
                style={{
                  backgroundColor: `${theme.primaryColor}15`,
                  borderColor: `${theme.primaryColor}40`,
                  color: theme.primaryColor
                }}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>FIA DOCS</span>
              </button>

              <button
                onClick={() => onLaunchTelemetry('VER', 'HAM')}
                title="Speed Trap Delta Analytics"
                className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-xs border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[9.5px] font-bold uppercase transition-colors cursor-pointer"
              >
                <Gauge className="w-3 h-3 text-cyan-400" />
                <span>SPEED TRAPS</span>
              </button>
            </div>
          </div>

          {/* 2. RACE CLASSIFICATION & GRID RESULTS */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col pt-0.5">
            <GridResultsTable
              results={overviewData.results || []}
            />
          </div>

        </div>

      </div>

      {/* FIA Technical Documents Modal */}
      <FiaDocumentsModal
        isOpen={isFiaModalOpen}
        onClose={() => setIsFiaModalOpen(false)}
        documents={fiaDocuments}
        eventTitle={overviewData.event?.name}
      />

      {/* Qualifying Delta Benchmark Modal */}
      <QualifyingDeltaModal
        isOpen={isQualifyingDeltaOpen}
        onClose={() => setIsQualifyingDeltaOpen(false)}
        year={year}
        gp={gp}
        initialDriver={qualifyingDriver}
        availableDrivers={(overviewData.drivers || []).map((d) => ({
          code: d.code,
          name: `${d.first_name || ''} ${d.last_name || d.code}`.trim(),
          team: d.team,
          team_color: d.team_color || '#FF8000',
        }))}
      />
    </div>
  );
};

