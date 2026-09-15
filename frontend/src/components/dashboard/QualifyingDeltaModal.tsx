import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { X, Trophy, TrendingUp, TrendingDown, Clock, Crosshair, ChevronRight, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { QualifyingDeltaPayload, CornerAnalysisItem } from '../../types/qualifying';
import { fetchQualifyingDelta } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface QualifyingDeltaModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  gp: string;
  initialDriver?: string;
  availableDrivers: Array<{ code: string; name?: string; team?: string; team_color?: string }>;
}

export const QualifyingDeltaModal: React.FC<QualifyingDeltaModalProps> = ({
  isOpen,
  onClose,
  year,
  gp,
  initialDriver = '',
  availableDrivers,
}) => {
  const { theme } = useTheme();
  const [selectedDriver, setSelectedDriver] = useState<string>(initialDriver);
  const [customInput, setCustomInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QualifyingDeltaPayload | null>(null);
  const [activeTab, setActiveTab] = useState<'sectors' | 'corners'>('sectors');
  const [selectedCorner, setSelectedCorner] = useState<CornerAnalysisItem | null>(null);

  const sectorChartRef = useRef<HTMLDivElement | null>(null);
  const sectorChartInstance = useRef<echarts.ECharts | null>(null);

  const cornerChartRef = useRef<HTMLDivElement | null>(null);
  const cornerChartInstance = useRef<echarts.ECharts | null>(null);

  // Set initial driver when opening
  useEffect(() => {
    if (isOpen) {
      const defaultDr = initialDriver || (availableDrivers.length > 1 ? availableDrivers[1].code : 'NOR');
      setSelectedDriver(defaultDr);
      loadDelta(defaultDr);
    }
  }, [isOpen, year, gp]);

  const loadDelta = async (driverCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchQualifyingDelta(year, gp, driverCode);
      setData(res);
      if (res.corner_analysis && res.corner_analysis.length > 0) {
        setSelectedCorner(res.corner_analysis[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to calculate qualifying delta');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDriver = (code: string) => {
    setSelectedDriver(code);
    loadDelta(code);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      const code = customInput.trim().toUpperCase();
      setSelectedDriver(code);
      loadDelta(code);
      setCustomInput('');
    }
  };

  // Render Sector Comparison EChart
  useEffect(() => {
    if (!data || !sectorChartRef.current || activeTab !== 'sectors') return;

    if (!sectorChartInstance.current) {
      sectorChartInstance.current = echarts.init(sectorChartRef.current);
    }

    const sectors = data.sector_breakdown.map((s) => s.sector);
    const deltas = data.sector_breakdown.map((s) => s.delta_seconds || 0);

    const option: echarts.EChartsOption = {

      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(9, 11, 16, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        textStyle: { color: '#FFFFFF', fontFamily: 'monospace', fontSize: 11 },
        formatter: (params: any) => {
          const idx = params[0].dataIndex;
          const s = data.sector_breakdown[idx];
          const dVal = s.delta_seconds ?? 0;
          const dStr = dVal > 0 ? `+${dVal.toFixed(3)}s (POLE faster)` : dVal < 0 ? `${dVal.toFixed(3)}s (${data.reference_driver.code} faster)` : '0.000s';
          return `
            <div style="font-weight:bold;margin-bottom:4px;color:#fff">${s.sector}</div>
            <div>${data.pole_driver.code} (Pole): <strong>${s.pole_time || '--'}</strong></div>
            <div>${data.reference_driver.code}: <strong>${s.driver_time || '--'}</strong></div>
            <div style="margin-top:4px;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;color:${dVal > 0 ? '#FF5252' : '#00E676'}">
              Delta: <strong>${dStr}</strong>
            </div>
          `;
        },
      },
      grid: {
        left: 45,
        right: 25,
        top: 35,
        bottom: 25,
      },
      xAxis: {
        type: 'category',
        data: sectors,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
        axisLabel: { color: '#94A3B8', fontFamily: 'monospace', fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Delta vs Pole (s)',
          nameTextStyle: { color: '#64748B', fontSize: 9, fontFamily: 'monospace' },
          splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
          axisLabel: {
            color: '#94A3B8',
            fontFamily: 'monospace',
            formatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}s`,
          },
        },
      ],
      series: [
        {
          name: 'Sector Delta',
          type: 'bar',
          barWidth: '38%',
          data: deltas.map((val) => ({
            value: val,
            itemStyle: {
              color: val > 0 ? '#EF4444' : '#10B981', // red if losing time to pole, green if gaining
              borderRadius: val >= 0 ? [3, 3, 0, 0] : [0, 0, 3, 3],
            },
          })),
          label: {
            show: true,
            position: 'top',
            color: '#FFFFFF',
            fontFamily: 'monospace',
            fontSize: 10,
            formatter: (p: any) => `${p.value > 0 ? '+' : ''}${Number(p.value).toFixed(3)}s`,
          },
        },
      ],
    };

    sectorChartInstance.current.setOption(option);

    const handleResize = () => sectorChartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, activeTab]);

  // Render Corner Telemetry Zoom EChart
  useEffect(() => {
    if (!data || !cornerChartRef.current || activeTab !== 'corners' || !selectedCorner) return;

    if (!cornerChartInstance.current) {
      cornerChartInstance.current = echarts.init(cornerChartRef.current);
    }

    const cDist = selectedCorner.distance;
    const windowStart = Math.max(0, cDist - 200);
    const windowEnd = cDist + 150;

    // Filter telemetry slice
    const subTel = data.telemetry.filter((t) => t.distance >= windowStart && t.distance <= windowEnd);
    if (subTel.length === 0) return;

    const poleColor = data.pole_driver.team_color || '#FF6A00';
    const driverColor = data.reference_driver.team_color || '#00F0FF';

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(9, 11, 16, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        textStyle: { color: '#FFFFFF', fontFamily: 'monospace', fontSize: 10 },
      },
      legend: {
        data: [`${data.pole_driver.code} Speed`, `${data.reference_driver.code} Speed`, `${data.pole_driver.code} Throttle`, `${data.reference_driver.code} Throttle`],
        textStyle: { color: '#94A3B8', fontSize: 10, fontFamily: 'monospace' },
        top: 0,
        right: 10,
      },
      grid: {
        left: 45,
        right: 45,
        top: 30,
        bottom: 25,
      },
      xAxis: {
        type: 'category',
        data: subTel.map((t) => `${t.distance}m`),
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
        axisLabel: { color: '#64748B', fontFamily: 'monospace', fontSize: 9 },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Speed (km/h)',
          nameTextStyle: { color: '#64748B', fontSize: 9 },
          splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
          axisLabel: { color: '#94A3B8', fontFamily: 'monospace', fontSize: 9 },
        },
        {
          type: 'value',
          name: 'Throttle / Brake %',
          nameTextStyle: { color: '#64748B', fontSize: 9 },
          max: 100,
          splitLine: { show: false },
          axisLabel: { color: '#64748B', fontFamily: 'monospace', fontSize: 9 },
        },
      ],
      series: [
        {
          name: `${data.pole_driver.code} Speed`,
          type: 'line',
          yAxisIndex: 0,
          showSymbol: false,
          smooth: true,
          data: subTel.map((t) => t.speed_pole),
          lineStyle: { color: poleColor, width: 2 },
        },
        {
          name: `${data.reference_driver.code} Speed`,
          type: 'line',
          yAxisIndex: 0,
          showSymbol: false,
          smooth: true,
          data: subTel.map((t) => t.speed_driver),
          lineStyle: { color: driverColor, width: 2 },
        },
        {
          name: `${data.pole_driver.code} Throttle`,
          type: 'line',
          yAxisIndex: 1,
          showSymbol: false,
          data: subTel.map((t) => t.throttle_pole),
          lineStyle: { color: poleColor, width: 1, type: 'dashed' },
        },
        {
          name: `${data.reference_driver.code} Throttle`,
          type: 'line',
          yAxisIndex: 1,
          showSymbol: false,
          data: subTel.map((t) => t.throttle_driver),
          lineStyle: { color: driverColor, width: 1, type: 'dashed' },
        },
      ],
    };

    cornerChartInstance.current.setOption(option);

    const handleResize = () => cornerChartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, activeTab, selectedCorner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none font-mono">
      <div className="bg-[#080A0E] border border-white/20 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="px-4 py-2 bg-[#0C0E14] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ backgroundColor: `${theme.primaryColor}22`, color: theme.primaryColor }}
            >
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-black text-xs text-white tracking-wider uppercase">
                  QUALIFYING DELTA BENCHMARK
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold uppercase">
                  VS POLE POSITION
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {year} {gp.toUpperCase()} GRAND PRIX &bull; QUALIFYING CLASSIFICATION & TELEMETRY
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Driver Selection & Mode Header */}
        <div className="px-4 py-2 bg-[#090B10] border-b border-white/5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Driver quick picker */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">SELECT DRIVER:</span>
            {availableDrivers.slice(0, 10).map((d) => {
              const isSelected = (data?.reference_driver.code || selectedDriver) === d.code;
              const isPole = data?.pole_driver.code === d.code;
              return (
                <button
                  key={d.code}
                  onClick={() => handleSelectDriver(d.code)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: d.team_color || '#888' }}
                  />
                  <span>{d.code}</span>
                  {isPole && <span className="text-[8px] text-amber-400">(POLE)</span>}
                </button>
              );
            })}

            {/* Custom input */}
            <form onSubmit={handleCustomSubmit} className="flex items-center ml-1">
              <input
                type="text"
                placeholder="OTHER CODE..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                maxLength={3}
                className="w-20 px-1.5 py-0.5 bg-black/50 border border-white/10 rounded text-[10px] uppercase text-white focus:outline-none focus:border-cyan-400 placeholder-slate-600"
              />
            </form>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded border border-white/10 text-[10px]">
            <button
              onClick={() => setActiveTab('sectors')}
              className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sectors'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>SECTORS & THEORETICAL</span>
            </button>
            <button
              onClick={() => setActiveTab('corners')}
              className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'corners'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crosshair className="w-3 h-3" />
              <span>CORNER-LEVEL TELEMETRY</span>
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              <div className="font-orbitron font-bold text-xs text-white">
                SYNCHRONIZING QUALIFYING TELEMETRY & CALCULATING DELTAS...
              </div>
              <div className="text-[10px] text-slate-500">
                Fetching micro-sectors, theoretical ideal sum, and corner apex speeds...
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-red-400 p-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div className="font-bold text-sm">QUALIFYING DATA NOT AVAILABLE</div>
              <div className="text-xs text-slate-400 max-w-md text-center">{error}</div>
              <button
                onClick={() => loadDelta(selectedDriver)}
                className="mt-2 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <>
              {/* TOP HERO COMPARISON BANNER */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 shrink-0">
                {/* Pole Driver Card */}
                <div className="md:col-span-4 bg-[#0B0E14] border border-amber-400/30 rounded p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-[9px] font-bold text-amber-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      POLE BENCHMARK
                    </span>
                    <span className="text-[10px] text-slate-400">#{data.pole_driver.number}</span>
                  </div>
                  <div className="my-1 flex items-baseline justify-between">
                    <div>
                      <div className="text-sm font-black font-orbitron text-white">
                        {data.pole_driver.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {data.pole_driver.team}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black font-orbitron text-amber-300">
                        {data.pole_driver.lap_time}
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase">OFFICIAL POLE</div>
                    </div>
                  </div>
                  {/* Theoretical Lap info */}
                  {data.pole_driver.theoretical && (
                    <div className="mt-1 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">THEORETICAL BEST:</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {data.pole_driver.theoretical.lap_time}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        -{data.pole_driver.time_left_on_table.toFixed(3)}s potential
                      </span>
                    </div>
                  )}
                </div>

                {/* Center Delta Delta Badge */}
                <div className="md:col-span-4 bg-[#090C12] border border-white/10 rounded p-2.5 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    QUALIFYING GAP TO POLE
                  </span>
                  <div
                    className={`text-2xl font-black font-orbitron my-0.5 flex items-center gap-1.5 ${
                      data.overall_delta === 0
                        ? 'text-amber-300'
                        : data.overall_delta > 0
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {data.overall_delta > 0 ? (
                      <TrendingUp className="w-5 h-5 text-red-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-emerald-400" />
                    )}
                    <span>
                      {data.overall_delta > 0
                        ? `+${data.overall_delta.toFixed(3)}s`
                        : data.overall_delta === 0
                        ? 'POLE POSITION'
                        : `${data.overall_delta.toFixed(3)}s`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {data.overall_delta > 0
                      ? `${data.reference_driver.code} is +${data.overall_delta.toFixed(3)}s adrift of ${data.pole_driver.code}`
                      : `${data.reference_driver.code} holds the fastest session lap`}
                  </div>
                </div>

                {/* Reference Driver Card */}
                <div className="md:col-span-4 bg-[#0B0E14] border border-cyan-400/30 rounded p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-[9px] font-bold text-cyan-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      REFERENCE DRIVER
                    </span>
                    <span className="text-[10px] text-slate-400">#{data.reference_driver.number}</span>
                  </div>
                  <div className="my-1 flex items-baseline justify-between">
                    <div>
                      <div className="text-sm font-black font-orbitron text-white">
                        {data.reference_driver.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {data.reference_driver.team}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black font-orbitron text-cyan-300">
                        {data.reference_driver.lap_time}
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase">FASTEST Q LAP</div>
                    </div>
                  </div>
                  {/* Theoretical Lap info */}
                  {data.reference_driver.theoretical && (
                    <div className="mt-1 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">THEORETICAL BEST:</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {data.reference_driver.theoretical.lap_time}
                      </span>
                      <span className="text-[9px] text-amber-400 font-bold">
                        -{data.reference_driver.time_left_on_table.toFixed(3)}s left on table
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* TAB 1: SECTORS & THEORETICAL BEST */}
              {activeTab === 'sectors' && (
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
                  {/* Left: Sector Time Breakdown Bar Chart */}
                  <div className="lg:col-span-7 bg-[#090C12] border border-white/10 rounded p-3 flex flex-col">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase font-orbitron">
                        <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>SECTOR TIME BREAKDOWN & DELTAS</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        GREEN = GAIN // RED = LOSS TO POLE
                      </span>
                    </div>

                    <div ref={sectorChartRef} className="flex-1 min-h-[200px]" />

                    {/* Sector Times Table */}
                    <div className="mt-2 border-t border-white/5 pt-2 grid grid-cols-3 gap-2">
                      {data.sector_breakdown.map((s) => (
                        <div
                          key={s.sector}
                          className="bg-white/[0.02] border border-white/5 rounded p-2 text-center"
                        >
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{s.sector}</div>
                          <div className="text-xs font-bold text-white mt-1">
                            {s.driver_time} <span className="text-[9px] text-slate-500">vs {s.pole_time}</span>
                          </div>
                          <div
                            className={`text-[10px] font-bold mt-0.5 ${
                              (s.delta_seconds || 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                            }`}
                          >
                            {(s.delta_seconds || 0) > 0 ? `+${s.delta_seconds?.toFixed(3)}s` : `${s.delta_seconds?.toFixed(3)}s`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Theoretical Best Lap Analysis */}
                  <div className="lg:col-span-5 bg-[#090C12] border border-white/10 rounded p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase font-orbitron">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>THEORETICAL BEST LAP ANALYSIS</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300 leading-relaxed">
                        The <strong>Theoretical Best Lap</strong> is calculated by combining {data.reference_driver.name}'s lowest Sector 1, Sector 2, and Sector 3 times recorded across all Qualifying runs.
                      </div>

                      {data.reference_driver.theoretical && (
                        <div className="mt-3 space-y-2">
                          <div className="bg-white/[0.02] border border-white/5 rounded p-2.5 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase block">ACTUAL FASTEST LAP</span>
                              <span className="text-sm font-bold text-white font-mono">
                                {data.reference_driver.lap_time}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase block">THEORETICAL IDEAL</span>
                              <span className="text-sm font-bold text-emerald-400 font-mono">
                                {data.reference_driver.theoretical.lap_time}
                              </span>
                            </div>
                          </div>

                          <div className="bg-amber-400/10 border border-amber-400/30 rounded p-2.5 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-amber-300 font-bold uppercase block">TIME LEFT ON THE TABLE</span>
                              <span className="text-xs text-slate-300">
                                Potential gain with clean sector aggregation
                              </span>
                            </div>
                            <span className="text-base font-black font-orbitron text-amber-400">
                              -{data.reference_driver.time_left_on_table.toFixed(3)}s
                            </span>
                          </div>

                          {/* Ideal Sectors List */}
                          <div className="border border-white/5 rounded p-2 bg-black/20 space-y-1 text-[11px]">
                            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">
                              OPTIMAL SECTOR AGGREGATES
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span>Best Sector 1:</span>
                              <strong className="text-white font-mono">{data.reference_driver.theoretical.best_s1}s</strong>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span>Best Sector 2:</span>
                              <strong className="text-white font-mono">{data.reference_driver.theoretical.best_s2}s</strong>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span>Best Sector 3:</span>
                              <strong className="text-white font-mono">{data.reference_driver.theoretical.best_s3}s</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 pt-2 border-t border-white/5">
                      FastF1 Timing App Data &bull; Microsector aggregation over session laps
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CORNER-LEVEL TELEMETRY ANALYSIS */}
              {activeTab === 'corners' && (
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
                  {/* Left: Corner Table Breakdown */}
                  <div className="lg:col-span-6 bg-[#090C12] border border-white/10 rounded flex flex-col overflow-hidden">
                    <div className="px-3 py-2 bg-[#0C0E14] border-b border-white/5 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase font-orbitron">
                        <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                        <span>CORNER-BY-CORNER TELEMETRY DELTAS</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {data.corner_analysis.length} CORNERS DETECTED
                      </span>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 px-3 py-1.5 bg-white/[0.02] border-b border-white/5 text-[9px] font-bold text-slate-400 uppercase shrink-0">
                      <span className="col-span-2">CORNER</span>
                      <span className="col-span-3 text-right">APEX SPEED</span>
                      <span className="col-span-2 text-right">&Delta; SPEED</span>
                      <span className="col-span-3 text-right">BRAKING PT</span>
                      <span className="col-span-2 text-right">&Delta; BRAKE</span>
                    </div>

                    {/* Table Rows */}
                    <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
                      {data.corner_analysis.map((c) => {
                        const isSelected = selectedCorner?.corner_number === c.corner_number;
                        const speedDiff = c.deltas.apex_speed;
                        const brkDiff = c.deltas.braking_delta_m;

                        return (
                          <div
                            key={c.corner_number}
                            onClick={() => setSelectedCorner(c)}
                            className={`grid grid-cols-12 items-center px-3 py-1.5 text-[10px] font-mono cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-cyan-500/15 border-l-2 border-cyan-400 text-white'
                                : 'hover:bg-white/[0.04] text-slate-300'
                            }`}
                          >
                            <div className="col-span-2 font-bold font-orbitron text-white">
                              {c.corner_label}
                            </div>
                            <div className="col-span-3 text-right">
                              <span>{c.driver.apex_speed}</span>
                              <span className="text-[8px] text-slate-500"> vs {c.pole.apex_speed}</span>
                            </div>
                            <div
                              className={`col-span-2 text-right font-bold ${
                                speedDiff > 0 ? 'text-emerald-400' : speedDiff < 0 ? 'text-red-400' : 'text-slate-400'
                              }`}
                            >
                              {speedDiff > 0 ? `+${speedDiff}` : speedDiff}kph
                            </div>
                            <div className="col-span-3 text-right text-slate-400">
                              {c.driver.braking_distance ? `${Math.round(c.driver.braking_distance)}m` : 'N/A'}
                            </div>
                            <div
                              className={`col-span-2 text-right font-bold ${
                                brkDiff !== null
                                  ? brkDiff > 0
                                    ? 'text-cyan-400'
                                    : 'text-amber-400'
                                  : 'text-slate-500'
                              }`}
                            >
                              {brkDiff !== null ? `${brkDiff > 0 ? '+' : ''}${brkDiff}m` : '--'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Zoomed Corner Telemetry & Insights */}
                  <div className="lg:col-span-6 bg-[#090C12] border border-white/10 rounded p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                        <div className="text-xs font-bold text-white uppercase font-orbitron flex items-center gap-1.5">
                          <span>CORNER INSPECTOR // {selectedCorner ? selectedCorner.corner_label : 'SELECT A CORNER'}</span>
                        </div>
                        {selectedCorner && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Apex at {Math.round(selectedCorner.distance)}m
                          </span>
                        )}
                      </div>

                      {/* ECharts Telemetry Curves */}
                      <div ref={cornerChartRef} className="h-[200px] w-full" />

                      {/* Corner Metric Cards */}
                      {selectedCorner && (
                        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                          {/* 1. Braking Point */}
                          <div className="bg-white/[0.02] border border-white/5 rounded p-2">
                            <span className="text-slate-500 font-bold block uppercase">BRAKING POINT</span>
                            <div className="text-xs font-bold text-white mt-0.5">
                              {selectedCorner.driver.braking_distance
                                ? `${Math.round(selectedCorner.driver.braking_distance)}m`
                                : 'Lift / Coast'}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              Pole: {selectedCorner.pole.braking_distance ? `${Math.round(selectedCorner.pole.braking_distance)}m` : 'N/A'}
                            </div>
                            {selectedCorner.deltas.braking_delta_m !== null && (
                              <div
                                className={`text-[9px] font-bold mt-1 ${
                                  selectedCorner.deltas.braking_delta_m > 0
                                    ? 'text-cyan-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {selectedCorner.deltas.braking_delta_m > 0
                                  ? `${selectedCorner.deltas.braking_delta_m}m deeper`
                                  : `${Math.abs(selectedCorner.deltas.braking_delta_m)}m earlier`}
                              </div>
                            )}
                          </div>

                          {/* 2. Apex Speed */}
                          <div className="bg-white/[0.02] border border-white/5 rounded p-2">
                            <span className="text-slate-500 font-bold block uppercase">MIN APEX SPEED</span>
                            <div className="text-xs font-bold text-white mt-0.5">
                              {selectedCorner.driver.apex_speed} km/h
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              Pole: {selectedCorner.pole.apex_speed} km/h
                            </div>
                            <div
                              className={`text-[9px] font-bold mt-1 ${
                                selectedCorner.deltas.apex_speed > 0
                                  ? 'text-emerald-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {selectedCorner.deltas.apex_speed > 0
                                ? `+${selectedCorner.deltas.apex_speed} km/h faster`
                                : `${selectedCorner.deltas.apex_speed} km/h slower`}
                            </div>
                          </div>

                          {/* 3. Throttle Application */}
                          <div className="bg-white/[0.02] border border-white/5 rounded p-2">
                            <span className="text-slate-500 font-bold block uppercase">THROTTLE PICK-UP</span>
                            <div className="text-xs font-bold text-white mt-0.5">
                              {selectedCorner.driver.throttle_distance
                                ? `${Math.round(selectedCorner.driver.throttle_distance)}m`
                                : 'Gradual'}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              Pole: {selectedCorner.pole.throttle_distance ? `${Math.round(selectedCorner.pole.throttle_distance)}m` : 'N/A'}
                            </div>
                            {selectedCorner.deltas.throttle_delta_m !== null && (
                              <div
                                className={`text-[9px] font-bold mt-1 ${
                                  selectedCorner.deltas.throttle_delta_m <= 0
                                    ? 'text-emerald-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {selectedCorner.deltas.throttle_delta_m <= 0
                                  ? `${Math.abs(selectedCorner.deltas.throttle_delta_m)}m earlier power`
                                  : `${selectedCorner.deltas.throttle_delta_m}m delayed power`}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 pt-2 border-t border-white/5">
                      Distance aligned via FastF1 lap.get_car_data().add_distance()
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer info strip */}
        <div className="px-4 py-1.5 bg-[#0C0E14] border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
          <div>ApexData Qualifying Intelligence Engine &bull; FastF1 Timing & Car Telemetry</div>
          <div>Reference Comparison vs Official Pole Position</div>
        </div>
      </div>
    </div>
  );
};
