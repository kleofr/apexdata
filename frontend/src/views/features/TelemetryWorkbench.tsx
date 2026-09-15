import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ComparisonData, TelemetryPoint, Driver } from '../../types/telemetry';
import { PlaybackControls } from '../../components/PlaybackControls';
import { SummaryHeader } from '../../components/SummaryHeader';
import { TelemetryHUDReadout } from '../../components/TelemetryHUDReadout';
import { CircuitMap } from '../../components/CircuitMap';
import { TelemetryChartStack } from '../../components/TelemetryChartStack';
import { DriverSelector } from '../../components/DriverSelector';
import { useLapPlayback } from '../../hooks/useLapPlayback';
import { useTheme } from '../../context/ThemeContext';

interface TelemetryWorkbenchProps {
  comparisonData: ComparisonData;
  drivers: Driver[];
  driver1: string;
  driver2: string;
  onDriver1Change: (d: string) => void;
  onDriver2Change: (d: string) => void;
  onSwapDrivers: () => void;
  onCompare: () => void;
  onBackToDashboard: () => void;
  loadingCompare: boolean;
}

export const TelemetryWorkbench: React.FC<TelemetryWorkbenchProps> = ({
  comparisonData,
  drivers,
  driver1,
  driver2,
  onDriver1Change,
  onDriver2Change,
  onSwapDrivers,
  onCompare,
  onBackToDashboard,
  loadingCompare,
}) => {
  const { theme } = useTheme();
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryPoint | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [isCircuitFullscreen, setIsCircuitFullscreen] = useState<boolean>(false);

  const playback = useLapPlayback({
    data: comparisonData,
    onPointChange: setHoveredPoint,
  });

  const d1Color = comparisonData.driver1.team_color || theme.primaryColor;
  const d2Color = comparisonData.driver2.team_color || theme.secondaryColor;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[#050608] text-slate-100 p-1 gap-1 select-none font-mono">
      {/* Top Controls Bar (Card-less) */}
      <div className="h-7 border-b border-white/[0.06] px-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>BACK TO OVERVIEW</span>
          </button>
          <span className="text-slate-600">|</span>
          <span className="font-orbitron font-bold text-xs text-white">
            {comparisonData.summary.year} {comparisonData.summary.gp} ({comparisonData.summary.session})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer font-bold"
          >
            <span>CHANGE DRIVERS ({driver1} vs {driver2})</span>
          </button>
        </div>
      </div>

      {/* Synchronized Playback Strip */}
      <div className="shrink-0 border-b border-white/[0.06]">
        <PlaybackControls
          isPlaying={playback.isPlaying}
          playbackSpeed={playback.playbackSpeed}
          playbackMode={playback.playbackMode}
          currentDistance={playback.currentDistance}
          currentElapsedTime={playback.currentElapsedTime}
          totalLapTime={playback.totalLapTime}
          trackLength={comparisonData.summary.track_length}
          progressPercent={playback.progressPercent}
          d1Code={comparisonData.driver1.code}
          d2Code={comparisonData.driver2.code}
          d1Color={d1Color}
          d2Color={d2Color}
          onTogglePlay={playback.togglePlay}
          onSetSpeed={playback.setSpeed}
          onSetMode={playback.setMode}
          onSeekFraction={playback.seekFraction}
          onStepForward={playback.stepForward}
          onStepBackward={playback.stepBackward}
        />
      </div>

      {/* TOP SECTION (31% Height): Left = HUD Readout, Right = Circuit Delta Map (Card-less) */}
      <section className="h-[31%] min-h-0 flex flex-col md:flex-row gap-1 overflow-hidden border-b border-white/[0.06]">
        <div className="w-full md:w-5/12 flex flex-col overflow-hidden pr-0.5">
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <SummaryHeader
              driver1={comparisonData.driver1}
              driver2={comparisonData.driver2}
              delta={comparisonData.summary.delta}
              fasterDriver={comparisonData.summary.faster_driver}
              year={comparisonData.summary.year}
              gp={comparisonData.summary.gp}
              session={comparisonData.summary.session}
              trackLength={comparisonData.summary.track_length}
              trackTemp={comparisonData.summary.track_temp}
              airTemp={comparisonData.summary.air_temp}
            />
            <div className="shrink-0">
              <TelemetryHUDReadout
                currentPoint={hoveredPoint}
                driver1={comparisonData.driver1}
                driver2={comparisonData.driver2}
                trackLength={comparisonData.summary.track_length}
                d1Color={d1Color}
                d2Color={d2Color}
                corners={comparisonData.corners}
              />
            </div>
          </div>
        </div>

        <div className="w-full md:w-7/12 h-full min-h-0 overflow-hidden border-l border-white/[0.06]">
          <CircuitMap
            data={comparisonData}
            hoveredPoint={hoveredPoint}
            onHoverPoint={(p) => setHoveredPoint(p)}
            d1Color={d1Color}
            d2Color={d2Color}
            playback={playback}
            isFullscreen={isCircuitFullscreen}
            onToggleFullscreen={setIsCircuitFullscreen}
          />
        </div>
      </section>

      {/* BOTTOM SECTION: 3x2 Multi-Channel Chart Stack */}
      <section className="flex-1 min-h-0 overflow-hidden">
        <TelemetryChartStack
          data={comparisonData}
          activePoint={hoveredPoint}
          isPlaying={playback.isPlaying}
          onHoverPoint={(p) => setHoveredPoint(p)}
          d1Color={d1Color}
          d2Color={d2Color}
          isOverlayActive={isCompareModalOpen || isCircuitFullscreen}
        />
      </section>

      {/* Driver Selection Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0E1118] border border-white/20 rounded-lg shadow-2xl w-full max-w-md flex flex-col">
            <div className="px-4 py-2.5 border-b border-white/10 bg-[#121520] flex items-center justify-between rounded-t-lg">
              <span className="font-orbitron font-bold text-xs uppercase tracking-wider text-white">
                SELECT DRIVERS TO COMPARE
              </span>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded hover:bg-white/10 cursor-pointer"
              >
                ESC ✕
              </button>
            </div>
            <div className="p-3">
              <DriverSelector
                drivers={drivers}
                driver1={driver1}
                driver2={driver2}
                onDriver1Change={onDriver1Change}
                onDriver2Change={onDriver2Change}
                onSwapDrivers={onSwapDrivers}
                onCompare={() => {
                  onCompare();
                  setIsCompareModalOpen(false);
                }}
                loadingCompare={loadingCompare}
                disabled={false}
                driver1Color={d1Color}
                driver2Color={d2Color}
                onSubmitted={() => setIsCompareModalOpen(false)}
                currentSessionLabel={`${comparisonData.summary.year} ${comparisonData.summary.gp}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
