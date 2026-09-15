import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';
import { QualifyingDeltaPayload, CornerAnalysisItem } from '../../types/qualifying';
import { fetchQualifyingDelta } from '../../services/api';
import { QualifyingCircuitMap } from '../../components/dashboard/QualifyingCircuitMap';

interface QualifyingDeltaWorkbenchProps {
  year: number;
  gp: string;
  initialDriver?: string;
  availableDrivers: Array<{ code: string; name?: string; team?: string; team_color?: string }>;
  onBackToDashboard: () => void;
}

export const QualifyingDeltaWorkbench: React.FC<QualifyingDeltaWorkbenchProps> = ({
  year,
  gp,
  initialDriver = '',
  availableDrivers,
  onBackToDashboard,
}) => {
  const [selectedDriver, setSelectedDriver] = useState<string>(initialDriver);
  const [customInput, setCustomInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QualifyingDeltaPayload | null>(null);
  const [selectedCorner, setSelectedCorner] = useState<CornerAnalysisItem | null>(null);

  // ECharts container references
  const sectorChartRef = useRef<HTMLDivElement | null>(null);
  const sectorChartInstance = useRef<echarts.ECharts | null>(null);

  const speedChartRef = useRef<HTMLDivElement | null>(null);
  const speedChartInstance = useRef<echarts.ECharts | null>(null);

  const throttleChartRef = useRef<HTMLDivElement | null>(null);
  const throttleChartInstance = useRef<echarts.ECharts | null>(null);

  const brakeChartRef = useRef<HTMLDivElement | null>(null);
  const brakeChartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const defaultDr = initialDriver || (availableDrivers.length > 1 ? availableDrivers[1].code : 'NOR');
    setSelectedDriver(defaultDr);
    loadDelta(defaultDr);
  }, [year, gp]);

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

  // 1. Render Sector Breakdown Bar Chart (Tight margins, no empty top/bottom space)
  useEffect(() => {
    if (!data || !sectorChartRef.current) return;

    if (sectorChartInstance.current) {
      sectorChartInstance.current.dispose();
    }
    sectorChartInstance.current = echarts.init(sectorChartRef.current, undefined, { renderer: 'canvas' });

    const sectors = data.sector_breakdown.map((s) => s.sector.replace('Sector ', 'S'));
    const deltas = data.sector_breakdown.map((s) => s.delta_seconds || 0);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(9, 11, 16, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: [6, 10],
        textStyle: { color: '#FFFFFF', fontFamily: 'monospace', fontSize: 9.5 },
        formatter: (params: any) => {
          const idx = params[0].dataIndex;
          const s = data.sector_breakdown[idx];
          const dVal = s.delta_seconds ?? 0;
          const dStr = dVal > 0 ? `+${dVal.toFixed(3)}s (POLE faster)` : dVal < 0 ? `${dVal.toFixed(3)}s (${data.reference_driver.code} faster)` : '0.000s';
          return `
            <div style="font-weight:bold;margin-bottom:2px;color:#fff">${s.sector}</div>
            <div>${data.pole_driver.code} (Pole): <strong>${s.pole_time || '--'}</strong></div>
            <div>${data.reference_driver.code}: <strong>${s.driver_time || '--'}</strong></div>
            <div style="margin-top:2px;border-top:1px solid rgba(255,255,255,0.1);padding-top:2px;color:${dVal > 0 ? '#FF5252' : '#00E676'}">
              Delta: <strong>${dStr}</strong>
            </div>
          `;
        },
      },
      grid: {
        left: 40,
        right: 14,
        top: 22,
        bottom: 20,
      },
      xAxis: {
        type: 'category',
        data: sectors,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
        axisLabel: { color: '#94A3B8', fontFamily: 'monospace', fontSize: 9.5, fontWeight: 'bold' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.04)', type: 'dashed' } },
        axisLabel: {
          color: '#94A3B8',
          fontFamily: 'monospace',
          fontSize: 8.5,
          formatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}s`,
        },
      },
      series: [
        {
          name: 'Sector Delta',
          type: 'bar',
          barWidth: '38%',
          data: deltas.map((val) => ({
            value: val,
            itemStyle: {
              color: val > 0 ? '#EF4444' : '#10B981',
              borderRadius: val >= 0 ? [3, 3, 0, 0] : [0, 0, 3, 3],
            },
            label: {
              show: true,
              position: val >= 0 ? 'top' : 'bottom',
              color: '#FFFFFF',
              fontFamily: 'monospace',
              fontSize: 9,
              fontWeight: 'bold',
              formatter: () => `${val > 0 ? '+' : ''}${Number(val).toFixed(3)}s`,
            },
          })),
        },
      ],
    };

    sectorChartInstance.current.setOption(option, true);
    sectorChartInstance.current.resize();
  }, [data]);

  // 2. Render Synchronized Telemetry Curves (Speed, Throttle, and Brake Separated)
  useEffect(() => {
    if (!data || !speedChartRef.current || !throttleChartRef.current || !brakeChartRef.current) return;

    if (speedChartInstance.current) speedChartInstance.current.dispose();
    if (throttleChartInstance.current) throttleChartInstance.current.dispose();
    if (brakeChartInstance.current) brakeChartInstance.current.dispose();

    speedChartInstance.current = echarts.init(speedChartRef.current, undefined, { renderer: 'canvas' });
    throttleChartInstance.current = echarts.init(throttleChartRef.current, undefined, { renderer: 'canvas' });
    brakeChartInstance.current = echarts.init(brakeChartRef.current, undefined, { renderer: 'canvas' });

    const poleColor = data.pole_driver.team_color || '#FF6A00';
    const driverColor = data.reference_driver.team_color || '#00F0FF';
    const distData = data.telemetry.map((t) => t.distance);

    const turnMarkLines = {
      silent: true,
      symbol: ['none', 'none'],
      lineStyle: { color: 'rgba(255, 255, 255, 0.12)', type: 'dashed', width: 1 },
      data: (data.corner_analysis || []).map((c) => ({
        xAxis: c.distance,
        label: {
          show: true,
          formatter: `T${c.corner_number}`,
          color: '#64748B',
          fontSize: 7.5,
          position: 'insideStartTop',
        },
      })),
    };

    // Common Base Grid & Axis Options
    const commonXAxis = (showLabels = false): echarts.XAXisComponentOption => ({
      type: 'category',
      data: distData,
      boundaryGap: false,
      show: true,
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.12)' } },
      axisLabel: {
        show: showLabels,
        color: '#64748B',
        fontSize: 8.5,
        fontFamily: 'monospace',
        formatter: (v: string) => `${v}m`,
      },
      splitLine: { show: true, lineStyle: { color: 'rgba(255, 255, 255, 0.03)' } },
    });

    // 1. Speed Chart Option (Hosts consolidated synchronized tooltip)
    const speedOption: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(9, 11, 16, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: [6, 10],
        textStyle: { color: '#FFFFFF', fontFamily: 'monospace', fontSize: 9.5 },
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          const idx = params[0].dataIndex;
          const sample = data.telemetry[idx];
          if (!sample) return '';

          const spdDelta = (sample.speed_driver - sample.speed_pole).toFixed(1);
          const spdDeltaNum = Number(spdDelta);

          return `
            <div style="font-weight:bold;margin-bottom:4px;color:#94A3B8;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:2px">
              DIST: ${sample.distance.toFixed(0)}m
            </div>
            <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:9.5px">
              <span style="color:${poleColor};font-weight:bold">${data.pole_driver.code} (Pole):</span>
              <span><strong>${sample.speed_pole.toFixed(0)}</strong> km/h | T: ${sample.throttle_pole.toFixed(0)}% | B: ${sample.brake_pole ? 'ON' : 'OFF'}</span>
              
              <span style="color:${driverColor};font-weight:bold">${data.reference_driver.code}:</span>
              <span><strong>${sample.speed_driver.toFixed(0)}</strong> km/h | T: ${sample.throttle_driver.toFixed(0)}% | B: ${sample.brake_driver ? 'ON' : 'OFF'}</span>
            </div>
            <div style="margin-top:4px;border-top:1px solid rgba(255,255,255,0.08);padding-top:2px;font-size:9px;color:${spdDeltaNum > 0 ? '#10B981' : spdDeltaNum < 0 ? '#EF4444' : '#94A3B8'}">
              Speed &Delta;: <strong>${spdDeltaNum > 0 ? `+${spdDelta}` : spdDelta} km/h</strong>
            </div>
          `;
        },
      },
      legend: {
        data: [`${data.pole_driver.code} (POLE)`, data.reference_driver.code],
        textStyle: { color: '#94A3B8', fontSize: 9, fontFamily: 'monospace' },
        top: 0,
        right: 10,
        itemHeight: 8,
        itemWidth: 14,
      },
      grid: { left: 42, right: 15, top: 16, bottom: 4 },
      xAxis: commonXAxis(false),
      yAxis: {
        type: 'value',
        name: 'km/h',
        nameTextStyle: { color: '#64748B', fontSize: 8 },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.04)', type: 'dashed' } },
        axisLabel: { color: '#64748B', fontSize: 8.5, fontFamily: 'monospace' },
      },
      series: [
        {
          name: `${data.pole_driver.code} (POLE)`,
          type: 'line',
          showSymbol: false,
          sampling: 'lttb',
          data: data.telemetry.map((t) => t.speed_pole),
          lineStyle: { color: poleColor, width: 2 },
          markLine: turnMarkLines as any,
        },
        {
          name: data.reference_driver.code,
          type: 'line',
          showSymbol: false,
          sampling: 'lttb',
          data: data.telemetry.map((t) => t.speed_driver),
          lineStyle: { color: driverColor, width: 1.8 },
        },
      ],
    };

    // 2. Throttle Chart Option (No separate overlapping tooltip)
    const throttleOption: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        show: false,
      },
      legend: {
        data: [`${data.pole_driver.code} Throttle`, `${data.reference_driver.code} Throttle`],
        textStyle: { color: '#94A3B8', fontSize: 9, fontFamily: 'monospace' },
        top: 0,
        right: 10,
        itemHeight: 8,
        itemWidth: 14,
      },
      grid: { left: 42, right: 15, top: 16, bottom: 4 },
      xAxis: commonXAxis(false),
      yAxis: {
        type: 'value',
        max: 105,
        min: 0,
        name: 'Thr %',
        nameTextStyle: { color: '#64748B', fontSize: 8 },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.04)', type: 'dashed' } },
        axisLabel: { color: '#64748B', fontSize: 8.5, fontFamily: 'monospace' },
      },
      series: [
        {
          name: `${data.pole_driver.code} Throttle`,
          type: 'line',
          showSymbol: false,
          data: data.telemetry.map((t) => t.throttle_pole),
          lineStyle: { color: poleColor, width: 1.6 },
          markLine: turnMarkLines as any,
        },
        {
          name: `${data.reference_driver.code} Throttle`,
          type: 'line',
          showSymbol: false,
          data: data.telemetry.map((t) => t.throttle_driver),
          lineStyle: { color: driverColor, width: 1.4 },
        },
      ],
    };

    // 3. Brake Chart Option (No separate overlapping tooltip)
    const brakeOption: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        show: false,
      },
      legend: {
        data: [`${data.pole_driver.code} Brake`, `${data.reference_driver.code} Brake`],
        textStyle: { color: '#94A3B8', fontSize: 9, fontFamily: 'monospace' },
        top: 0,
        right: 10,
        itemHeight: 8,
        itemWidth: 14,
      },
      grid: { left: 42, right: 15, top: 16, bottom: 18 },
      xAxis: commonXAxis(true),
      yAxis: {
        type: 'value',
        max: 105,
        min: 0,
        name: 'Brk %',
        nameTextStyle: { color: '#64748B', fontSize: 8 },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.04)', type: 'dashed' } },
        axisLabel: { color: '#64748B', fontSize: 8.5, fontFamily: 'monospace' },
      },
      series: [
        {
          name: `${data.pole_driver.code} Brake`,
          type: 'line',
          showSymbol: false,
          data: data.telemetry.map((t) => t.brake_pole),
          lineStyle: { color: '#EF4444', width: 1.4 },
          areaStyle: { color: 'rgba(239, 68, 68, 0.12)' },
          markLine: turnMarkLines as any,
        },
        {
          name: `${data.reference_driver.code} Brake`,
          type: 'line',
          showSymbol: false,
          data: data.telemetry.map((t) => t.brake_driver),
          lineStyle: { color: '#F59E0B', width: 1.4 },
          areaStyle: { color: 'rgba(245, 158, 11, 0.12)' },
        },
      ],
    };

    speedChartInstance.current.setOption(speedOption, true);
    throttleChartInstance.current.setOption(throttleOption, true);
    brakeChartInstance.current.setOption(brakeOption, true);

    speedChartInstance.current.group = 'qualifying-telemetry-group';
    throttleChartInstance.current.group = 'qualifying-telemetry-group';
    brakeChartInstance.current.group = 'qualifying-telemetry-group';
    echarts.connect('qualifying-telemetry-group');

    speedChartInstance.current.resize();
    throttleChartInstance.current.resize();
    brakeChartInstance.current.resize();

    const handleResize = () => {
      speedChartInstance.current?.resize();
      throttleChartInstance.current?.resize();
      brakeChartInstance.current?.resize();
      sectorChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[#050608] text-slate-100 p-1 gap-1 select-none font-mono">
      {/* Top Header Control Bar */}
      <div className="h-7 px-2 flex items-center justify-between shrink-0 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>BACK</span>
          </button>
          <span className="text-slate-600">|</span>
          <span className="font-orbitron font-bold text-xs text-white">
            {year} {gp.toUpperCase()} GP // QUALIFYING DELTA
          </span>
        </div>

        {/* Driver Select Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white font-bold uppercase tracking-wider">COMPARE:</span>
          <select
            value={data?.reference_driver.code || selectedDriver}
            onChange={(e) => handleSelectDriver(e.target.value)}
            className="bg-[#090C12] border border-white/20 rounded px-2 py-0.5 text-[10px] font-bold text-white focus:outline-none focus:border-white/50 cursor-pointer"
          >
            {availableDrivers.map((d) => (
              <option key={d.code} value={d.code} className="bg-[#090C12] text-white">
                {d.code} - {d.name || d.code} ({d.team})
              </option>
            ))}
          </select>

          <form onSubmit={handleCustomSubmit} className="flex items-center ml-1">
            <input
              type="text"
              placeholder="CUSTOM..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              maxLength={3}
              className="w-14 px-1 py-0.5 bg-black/50 border border-white/10 rounded text-[10px] uppercase text-white focus:outline-none focus:border-white placeholder-slate-600"
            />
          </form>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <div className="font-orbitron font-bold text-xs text-white">
            COMPILING QUALIFYING DELTA // {selectedDriver} VS POLE
          </div>
          <div className="text-[10px] text-slate-500">
            Calculating micro-sectors, theoretical ideal lap, and corner-by-corner braking points...
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-red-400 p-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div className="font-bold text-sm">QUALIFYING DATA UNAVAILABLE</div>
          <div className="text-xs text-slate-400 max-w-md text-center">{error}</div>
          <button
            onClick={() => loadDelta(selectedDriver)}
            className="mt-2 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <div className="flex-1 min-h-0 flex flex-col gap-1 overflow-hidden">
          
          {/* SECTION 1: TOP DENSE HERO STRIP */}
          <div className="h-9 px-2 flex items-center justify-between border-b border-white/[0.06] shrink-0 text-[10px]">
            {/* Pole Driver */}
            <div className="flex items-center gap-2.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: data.pole_driver.team_color || '#FF6A00' }}
              />
              <span className="font-orbitron font-black text-xs text-white">{data.pole_driver.code}</span>
              <span className="text-[9px] text-slate-500">#{data.pole_driver.number}</span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold uppercase">POLE</span>
              <span className="text-slate-400 truncate hidden sm:inline">({data.pole_driver.team})</span>
              <span className="font-orbitron font-bold text-xs text-amber-300 ml-1">{data.pole_driver.lap_time}</span>
              {data.pole_driver.theoretical && (
                <span className="text-[9px] text-slate-400 border-l border-white/10 pl-2">
                  Theo: <strong className="text-slate-200">{data.pole_driver.theoretical.lap_time}</strong> (-{data.pole_driver.time_left_on_table.toFixed(3)}s)
                </span>
              )}
            </div>

            {/* Overall Delta Badge */}
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded bg-white/[0.02]">
              <span className="text-[8px] text-slate-500 font-bold uppercase">GAP:</span>
              <div
                className={`font-orbitron font-black text-xs flex items-center gap-0.5 ${
                  data.overall_delta === 0
                    ? 'text-amber-300'
                    : data.overall_delta > 0
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }`}
              >
                {data.overall_delta > 0 ? (
                  <TrendingUp className="w-3 h-3 text-red-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-emerald-400" />
                )}
                <span>
                  {data.overall_delta > 0
                    ? `+${data.overall_delta.toFixed(3)}s`
                    : data.overall_delta === 0
                    ? 'POLE'
                    : `${data.overall_delta.toFixed(3)}s`}
                </span>
              </div>
            </div>

            {/* Reference Driver */}
            <div className="flex items-center gap-2.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: data.reference_driver.team_color || '#00F0FF' }}
              />
              <span className="font-orbitron font-black text-xs text-white">{data.reference_driver.code}</span>
              <span className="text-[9px] text-slate-500">#{data.reference_driver.number}</span>
              <span className="text-slate-400 truncate hidden sm:inline">({data.reference_driver.team})</span>
              <span className="font-orbitron font-bold text-xs text-cyan-300 ml-1">{data.reference_driver.lap_time}</span>
              {data.reference_driver.theoretical && (
                <span className="text-[9px] text-amber-300 border-l border-white/10 pl-2">
                  Theo: <strong className="text-emerald-400">{data.reference_driver.theoretical.lap_time}</strong> (-{data.reference_driver.time_left_on_table.toFixed(3)}s)
                </span>
              )}
            </div>
          </div>

          {/* SECTION 2: MIDDLE SPLIT (Left: Large Sector Bar Chart, Right: Circuit Map + Sector Times beside map) */}
          <div className="h-[44%] min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-1 overflow-hidden border-b border-white/[0.06]">
            
            {/* Col 5: Large Sector Delta Bar Graph */}
            <div className="lg:col-span-5 flex flex-col overflow-hidden p-1 min-h-0">
              <div className="flex items-center justify-between px-1 shrink-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  SECTOR DELTA (S1 / S2 / S3)
                </span>
                {data.reference_driver.theoretical && (
                  <span className="text-[8px] text-slate-500 font-mono">
                    IDEAL: <span className="text-slate-300">{data.reference_driver.theoretical.best_s1}s / {data.reference_driver.theoretical.best_s2}s / {data.reference_driver.theoretical.best_s3}s</span>
                  </span>
                )}
              </div>
              <div ref={sectorChartRef} className="flex-1 w-full min-h-0" />
            </div>

            {/* Col 7: Circuit Map with Sector Times Strip shifted beside it */}
            <div className="lg:col-span-7 h-full min-h-0 flex flex-col overflow-hidden border-l border-white/[0.06]">
              {/* Sector Times Strip positioned above/alongside Circuit Map */}
              <div className="grid grid-cols-3 gap-1 px-2 py-1 shrink-0 bg-white/[0.02] border-b border-white/[0.04]">
                {data.sector_breakdown.map((s) => (
                  <div key={s.sector} className="p-1 flex items-center justify-between">
                    <div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">{s.sector}</div>
                      <div className="text-[9.5px] font-bold text-white">
                        {s.driver_time} <span className="text-[7.5px] text-slate-500 font-normal">/ {s.pole_time}</span>
                      </div>
                    </div>
                    <div
                      className={`text-[9.5px] font-bold font-mono ${
                        (s.delta_seconds || 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {(s.delta_seconds || 0) > 0 ? `+${s.delta_seconds?.toFixed(3)}s` : `${s.delta_seconds?.toFixed(3)}s`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Circuit Map Canvas */}
              <div className="flex-1 min-h-0 relative">
                <QualifyingCircuitMap
                  telemetry={data.telemetry}
                  corners={data.corner_analysis}
                  poleDriver={{
                    code: data.pole_driver.code,
                    team_color: data.pole_driver.team_color,
                  }}
                  refDriver={{
                    code: data.reference_driver.code,
                    team_color: data.reference_driver.team_color,
                  }}
                  selectedCorner={selectedCorner}
                  onSelectCorner={setSelectedCorner}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: BOTTOM SPLIT (Left: Corner Table, Right: 3 Stacked Telemetry Traces) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-1 overflow-hidden">
            
            {/* Col 5: Corner Analysis Table & Selected Corner Inspector */}
            <div className="lg:col-span-5 flex flex-col overflow-hidden">
              <div className="px-2 pt-0.5 pb-0 flex items-center justify-between shrink-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  CORNER BENCHMARK METRICS
                </span>
                <span className="text-[8px] text-slate-500">CLICK TURN TO INSPECT</span>
              </div>
              {/* High-density corner table */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
                <div className="grid grid-cols-12 px-2 py-0.5 text-[8px] font-bold text-slate-400 uppercase sticky top-0 bg-[#050608] z-10 border-b border-white/[0.06]">
                  <span className="col-span-2">TURN</span>
                  <span className="col-span-3 text-right">APEX SPEED</span>
                  <span className="col-span-2 text-right">&Delta; SPD</span>
                  <span className="col-span-3 text-right">BRAKE PT</span>
                  <span className="col-span-2 text-right">&Delta; BRK</span>
                </div>
                {data.corner_analysis.map((c) => {
                  const isSelected = selectedCorner?.corner_number === c.corner_number;
                  const speedDiff = c.deltas.apex_speed;
                  const brkDiff = c.deltas.braking_delta_m;

                  return (
                    <div
                      key={c.corner_number}
                      onClick={() => setSelectedCorner(c)}
                      className={`grid grid-cols-12 items-center px-2 py-0.5 text-[9px] cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/20 text-white font-bold'
                          : 'hover:bg-white/[0.04] text-slate-300'
                      }`}
                    >
                      <div className="col-span-2 font-orbitron text-white">
                        {c.corner_label}
                      </div>
                      <div className="col-span-3 text-right">
                        <span>{c.driver.apex_speed}</span>
                        <span className="text-[8px] text-slate-500"> / {c.pole.apex_speed}</span>
                      </div>
                      <div
                        className={`col-span-2 text-right font-bold ${
                          speedDiff > 0 ? 'text-emerald-400' : speedDiff < 0 ? 'text-red-400' : 'text-slate-400'
                        }`}
                      >
                        {speedDiff > 0 ? `+${speedDiff}` : speedDiff}
                      </div>
                      <div className="col-span-3 text-right text-slate-400">
                        {c.driver.braking_distance ? `${Math.round(c.driver.braking_distance)}m` : '--'}
                      </div>
                      <div
                        className={`col-span-2 text-right font-bold ${
                          brkDiff !== null ? (brkDiff > 0 ? 'text-cyan-400' : 'text-amber-400') : 'text-slate-500'
                        }`}
                      >
                        {brkDiff !== null ? `${brkDiff > 0 ? '+' : ''}${brkDiff}m` : '--'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Corner Readout Strip */}
              {selectedCorner && (
                <div className="p-1 border-t border-white/[0.06] grid grid-cols-3 gap-1 text-[8.5px] shrink-0 bg-white/[0.01]">
                  <div>
                    <span className="text-slate-500 uppercase block">BRAKING</span>
                    <span className="text-white font-bold">
                      {selectedCorner.driver.braking_distance ? `${Math.round(selectedCorner.driver.braking_distance)}m` : 'Coast'}
                    </span>
                    <span className="text-slate-400 block text-[7.5px]">
                      {selectedCorner.deltas.braking_delta_m !== null
                        ? selectedCorner.deltas.braking_delta_m > 0
                          ? `+${selectedCorner.deltas.braking_delta_m}m deep`
                          : `${selectedCorner.deltas.braking_delta_m}m early`
                        : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block">APEX SPEED</span>
                    <span className="text-white font-bold">{selectedCorner.driver.apex_speed} kph</span>
                    <span
                      className={`block text-[7.5px] font-bold ${
                        selectedCorner.deltas.apex_speed > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {selectedCorner.deltas.apex_speed > 0 ? `+${selectedCorner.deltas.apex_speed}` : selectedCorner.deltas.apex_speed} kph
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block">THROTTLE</span>
                    <span className="text-white font-bold">
                      {selectedCorner.driver.throttle_distance ? `${Math.round(selectedCorner.driver.throttle_distance)}m` : '--'}
                    </span>
                    <span className="text-slate-400 block text-[7.5px]">
                      {selectedCorner.deltas.throttle_delta_m !== null
                        ? selectedCorner.deltas.throttle_delta_m <= 0
                          ? `${Math.abs(selectedCorner.deltas.throttle_delta_m)}m early`
                          : `${selectedCorner.deltas.throttle_delta_m}m late`
                        : '--'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Col 7: 3 Stacked Telemetry Traces (Speed, Throttle, Brake) */}
            <div className="lg:col-span-7 flex flex-col justify-between overflow-hidden border-l border-white/[0.06]">
              {/* Speed Trace */}
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="px-2 pt-0.5 flex items-center justify-between text-[8px] font-bold text-slate-400 shrink-0">
                  <span className="tracking-wider">SPEED TRACE (KM/H)</span>
                </div>
                <div ref={speedChartRef} className="flex-1 min-h-[55px] w-full" />
              </div>

              {/* Throttle Trace */}
              <div className="flex-1 min-h-0 flex flex-col border-t border-white/[0.04]">
                <div className="px-2 pt-0.5 flex items-center justify-between text-[8px] font-bold text-slate-400 shrink-0">
                  <span className="tracking-wider">THROTTLE APPLICATION (0-100%)</span>
                </div>
                <div ref={throttleChartRef} className="flex-1 min-h-[55px] w-full" />
              </div>

              {/* Brake Trace */}
              <div className="flex-1 min-h-0 flex flex-col border-t border-white/[0.04]">
                <div className="px-2 pt-0.5 flex items-center justify-between text-[8px] font-bold text-slate-400 shrink-0">
                  <span className="tracking-wider">BRAKE INPUT (ON/OFF)</span>
                </div>
                <div ref={brakeChartRef} className="flex-1 min-h-[58px] w-full" />
              </div>
            </div>

          </div>

        </div>
      ) : null}
    </div>
  );
};
