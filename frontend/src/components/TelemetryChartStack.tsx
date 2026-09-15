import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Download, Maximize2, X, Flag } from 'lucide-react';
import { ComparisonData, TelemetryPoint, CornerMarker } from '../types/telemetry';

interface TelemetryChartStackProps {
  data: ComparisonData;
  activePoint?: TelemetryPoint | null;
  isPlaying?: boolean;
  onHoverPoint: (point: TelemetryPoint | null) => void;
  d1Color: string;
  d2Color: string;
  isOverlayActive?: boolean;
}

interface ChartConfig {
  id: string;
  title: string;
  unit: string;
  height: number;
  renderOption: (
    data: ComparisonData,
    d1Color: string,
    d2Color: string,
    corners: CornerMarker[],
    isFullscreen?: boolean
  ) => echarts.EChartsOption;
}

export const TelemetryChartStack: React.FC<TelemetryChartStackProps> = ({
  data,
  activePoint,
  isPlaying,
  onHoverPoint,
  d1Color,
  d2Color,
  isOverlayActive = false,
}) => {
  const chartContainersRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const chartInstancesRef = useRef<{ [key: string]: echarts.ECharts | null }>({});

  // Fullscreen Modal State
  const [fullscreenChartId, setFullscreenChartId] = useState<string | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);
  const fullscreenInstanceRef = useRef<echarts.ECharts | null>(null);

  const corners = data.corners || [];
  const distanceData = data.telemetry.map((p) => p.distance);

  // Common dark theme options for all charts without glow - tight margins for non-scrollable pit wall layout
  const getCommonOptions = (showXAxis: boolean = true, isFullscreen: boolean = false): echarts.EChartsOption => ({
    backgroundColor: 'transparent',
    animation: false,
    grid: {
      left: isFullscreen ? 60 : 42,
      right: isFullscreen ? 30 : 14,
      top: isFullscreen ? 30 : 22,
      bottom: showXAxis ? (isFullscreen ? 35 : 20) : 6,
      containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(11, 14, 20, 0.96)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
      textStyle: {
        color: '#FFFFFF',
        fontFamily: 'monospace',
        fontSize: isFullscreen ? 11 : 10,
      },
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: '#FF6A00',
          width: 1,
          type: 'solid',
        },
        label: {
          backgroundColor: '#FF6A00',
          color: '#000000',
          fontFamily: 'monospace',
          fontSize: 9,
          fontWeight: 'bold',
          formatter: (params) => {
            if (params.axisDimension === 'x') {
              return `${Math.round(Number(params.value))}m`;
            }
            return Number(params.value).toFixed(1);
          },
        },
      },
    },
    xAxis: {
      type: 'category',
      data: distanceData,
      boundaryGap: false,
      show: showXAxis,
      axisLine: {
        lineStyle: { color: 'rgba(255, 255, 255, 0.12)' },
      },
      axisTick: {
        show: showXAxis,
        lineStyle: { color: 'rgba(255, 255, 255, 0.18)' },
      },
      axisLabel: {
        show: showXAxis,
        color: '#64748B',
        fontFamily: 'monospace',
        fontSize: isFullscreen ? 10 : 9,
        formatter: (val: string) => `${Math.round(Number(val))}m`,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.03)',
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#64748B',
        fontFamily: 'monospace',
        fontSize: isFullscreen ? 11 : 9,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.04)',
          type: 'dashed',
        },
      },
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'filter',
      },
    ],
  });

  // Helper to build Turn markLines along distance x-axis
  const getTurnMarkLines = (cornersList: CornerMarker[], distArray: number[]) => {
    if (!cornersList || cornersList.length === 0 || distArray.length === 0) return undefined;

    const markData = cornersList.map((c) => {
      // Find index in distArray closest to corner.distance
      let closestIdx = 0;
      let minDiff = Math.abs(distArray[0] - c.distance);
      for (let i = 1; i < distArray.length; i++) {
        const diff = Math.abs(distArray[i] - c.distance);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }

      return {
        name: `T${c.number}${c.letter || ''}`,
        xAxis: closestIdx,
        label: {
          formatter: `T${c.number}${c.letter || ''}`,
          color: '#64748B',
          fontSize: 8,
          fontFamily: 'Orbitron, monospace',
          position: 'insideEndTop',
        },
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.22)',
          type: 'dashed' as const,
          width: 1,
        },
      };
    });

    return {
      silent: true,
      symbol: 'none',
      data: markData as any,
    };
  };

  // Chart definitions (DRS removed as requested)
  const charts: ChartConfig[] = [
    // 1. SPEED TRACE
    {
      id: 'speed',
      title: 'SPEED TRACE',
      unit: 'km/h',
      height: 215,
      renderOption: (d, c1, c2, crns, isFs) => {
        const common = getCommonOptions(true, isFs);
        const yAxisBase = (common.yAxis as any) || {};
        const dists = d.telemetry.map((p) => p.distance);
        const turnMarks = getTurnMarkLines(crns, dists);

        return {
          ...common,
          yAxis: {
            ...yAxisBase,
            min: 40,
            max: (value: { max: number }) => Math.ceil((value.max + 15) / 20) * 20,
            axisLabel: {
              ...yAxisBase.axisLabel,
              formatter: '{value} km/h',
            },
          },
          series: [
            {
              name: `${d.driver1.code} (${d.driver1.team})`,
              type: 'line',
              showSymbol: false,
              sampling: 'lttb',
              data: d.telemetry.map((p) => p.speed1),
              lineStyle: { color: c1, width: 2.2 },
              markLine: turnMarks,
            },
            {
              name: `${d.driver2.code} (${d.driver2.team})`,
              type: 'line',
              showSymbol: false,
              sampling: 'lttb',
              data: d.telemetry.map((p) => p.speed2),
              lineStyle: { color: c2, width: 2.0 },
            },
          ],
        };
      },
    },

    // 2. DELTA TIME TRACE
    {
      id: 'delta',
      title: 'DELTA TIME TRACE',
      unit: 'Seconds (+/-)',
      height: 215,
      renderOption: (d, _c1, _c2, crns, isFs) => {
        const common = getCommonOptions(true, isFs);
        const yAxisBase = (common.yAxis as any) || {};
        const dists = d.telemetry.map((p) => p.distance);
        const turnMarks = getTurnMarkLines(crns, dists);

        return {
          ...common,
          yAxis: {
            ...yAxisBase,
            axisLabel: {
              ...yAxisBase.axisLabel,
              formatter: (v: any) => `${Number(v) > 0 ? '+' : ''}${Number(v).toFixed(2)}s`,
            },
          },
          series: [
            {
              name: `Delta (${d.driver1.code} vs ${d.driver2.code})`,
              type: 'line',
              showSymbol: false,
              sampling: 'lttb',
              data: d.telemetry.map((p) => p.delta),
              lineStyle: {
                color: '#FFFFFF',
                width: 2.2,
              },
              markLine: turnMarks,
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(0, 230, 118, 0.22)' },
                  { offset: 0.5, color: 'rgba(255, 255, 255, 0.02)' },
                  { offset: 1, color: 'rgba(255, 23, 68, 0.22)' },
                ]),
              },
            },
          ],
        };
      },
    },

    // 3. THROTTLE % TRACE
    {
      id: 'throttle',
      title: 'THROTTLE APPLICATION',
      unit: '%',
      height: 215,
      renderOption: (d, c1, c2, crns, isFs) => {
        const common = getCommonOptions(true, isFs);
        const yAxisBase = (common.yAxis as any) || {};
        const dists = d.telemetry.map((p) => p.distance);
        const turnMarks = getTurnMarkLines(crns, dists);

        return {
          ...common,
          yAxis: {
            ...yAxisBase,
            min: 0,
            max: 100,
            interval: 50,
            axisLabel: {
              ...yAxisBase.axisLabel,
              formatter: '{value}%',
            },
          },
          series: [
            {
              name: `${d.driver1.code} Throttle`,
              type: 'line',
              showSymbol: false,
              sampling: 'lttb',
              data: d.telemetry.map((p) => p.throttle1),
              lineStyle: { color: c1, width: 2.0 },
              markLine: turnMarks,
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: `${c1}33` },
                  { offset: 1, color: `${c1}05` },
                ]),
              },
            },
            {
              name: `${d.driver2.code} Throttle`,
              type: 'line',
              showSymbol: false,
              sampling: 'lttb',
              data: d.telemetry.map((p) => p.throttle2),
              lineStyle: { color: c2, width: 1.8, type: 'dashed' },
            },
          ],
        };
      },
    },

    // 4. BRAKE APPLICATION TRACE
    {
      id: 'brake',
      title: 'BRAKE APPLICATION',
      unit: '% / ON-OFF',
      height: 215,
      renderOption: (d, c1, c2, crns, isFs) => {
        const common = getCommonOptions(true, isFs);
        const yAxisBase = (common.yAxis as any) || {};
        const dists = d.telemetry.map((p) => p.distance);
        const turnMarks = getTurnMarkLines(crns, dists);

        return {
          ...common,
          yAxis: {
            ...yAxisBase,
            min: 0,
            max: 100,
            interval: 50,
            axisLabel: {
              ...yAxisBase.axisLabel,
              formatter: (v: any) => (Number(v) > 0 ? `${v}%` : 'OFF'),
            },
          },
          series: [
            {
              name: `${d.driver1.code} Brake`,
              type: 'line',
              showSymbol: false,
              sampling: 'lttb',
              data: d.telemetry.map((p) => p.brake1),
              lineStyle: { color: c1, width: 2.2 },
              markLine: turnMarks,
              areaStyle: {
                color: `${c1}40`,
              },
            },
            {
              name: `${d.driver2.code} Brake`,
              type: 'line',
              showSymbol: false,
              sampling: 'lttb',
              data: d.telemetry.map((p) => p.brake2),
              lineStyle: { color: c2, width: 2.0 },
              areaStyle: {
                color: `${c2}30`,
              },
            },
          ],
        };
      },
    },

    // 5. GEAR TRACE (STEPPED LINE)
    {
      id: 'gear',
      title: 'GEAR SELECTION',
      unit: 'Gear (1-8)',
      height: 215,
      renderOption: (d, c1, c2, crns, isFs) => {
        const common = getCommonOptions(true, isFs);
        const yAxisBase = (common.yAxis as any) || {};
        const dists = d.telemetry.map((p) => p.distance);
        const turnMarks = getTurnMarkLines(crns, dists);

        return {
          ...common,
          yAxis: {
            ...yAxisBase,
            min: 1,
            max: 8,
            interval: 1,
            axisLabel: {
              ...yAxisBase.axisLabel,
              formatter: 'G{value}',
            },
          },
          series: [
            {
              name: `${d.driver1.code} Gear`,
              type: 'line',
              step: 'end',
              showSymbol: false,
              data: d.telemetry.map((p) => p.gear1),
              lineStyle: { color: c1, width: 2.2 },
              markLine: turnMarks,
            },
            {
              name: `${d.driver2.code} Gear`,
              type: 'line',
              step: 'end',
              showSymbol: false,
              data: d.telemetry.map((p) => p.gear2),
              lineStyle: { color: c2, width: 2.0, type: 'dashed' },
            },
          ],
        };
      },
    },

    // 6. ENGINE RPM TRACE
    {
      id: 'rpm',
      title: 'ENGINE RPM',
      unit: 'RPM',
      height: 215,
      renderOption: (d, c1, c2, crns, isFs) => {
        const common = getCommonOptions(true, isFs);
        const yAxisBase = (common.yAxis as any) || {};
        const dists = d.telemetry.map((p) => p.distance);
        const turnMarks = getTurnMarkLines(crns, dists);

        return {
          ...common,
          yAxis: {
            ...yAxisBase,
            min: 4000,
            max: 13500,
            interval: 3000,
            axisLabel: {
              ...yAxisBase.axisLabel,
              formatter: '{value}',
            },
          },
          series: [
            {
              name: `${d.driver1.code} RPM`,
              type: 'line',
              showSymbol: false,
              sampling: 'lttb',
              data: d.telemetry.map((p) => p.rpm1),
              lineStyle: { color: c1, width: 1.8 },
              markLine: turnMarks,
            },
            {
              name: `${d.driver2.code} RPM`,
              type: 'line',
              showSymbol: false,
              sampling: 'lttb',
              data: d.telemetry.map((p) => p.rpm2),
              lineStyle: { color: c2, width: 1.8, type: 'dashed' },
            },
          ],
        };
      },
    },

    // 7. STEERING ANGLE TRACE
    {
      id: 'steering',
      title: 'STEERING ANGLE',
      unit: 'Deg (°)',
      height: 215,
      renderOption: (d, c1, c2, crns, isFs) => {
        const common = getCommonOptions(true, isFs);
        const yAxisBase = (common.yAxis as any) || {};
        const dists = d.telemetry.map((p) => p.distance);
        const turnMarks = getTurnMarkLines(crns, dists);

        return {
          ...common,
          yAxis: {
            ...yAxisBase,
            axisLabel: {
              ...yAxisBase.axisLabel,
              formatter: '{value}°',
            },
          },
          series: [
            {
              name: `${d.driver1.code} Steering`,
              type: 'line',
              showSymbol: false,
              sampling: 'lttb',
              data: d.telemetry.map((p) => p.steering1),
              lineStyle: { color: c1, width: 1.8 },
              markLine: turnMarks,
            },
            {
              name: `${d.driver2.code} Steering`,
              type: 'line',
              showSymbol: false,
              sampling: 'lttb',
              data: d.telemetry.map((p) => p.steering2),
              lineStyle: { color: c2, width: 1.8 },
            },
          ],
        };
      },
    },
  ];

  // Keep track of the last dispatched point index to prevent lag from multi-chart updateAxisPointer storms
  const lastDispatchedIndexRef = useRef<number>(-1);

  // Initialize and synchronize all charts
  useEffect(() => {
    const instances: { [key: string]: echarts.ECharts } = {};

    charts.forEach((chartConfig) => {
      const container = chartContainersRef.current[chartConfig.id];
      if (!container) return;

      const existing = echarts.getInstanceByDom(container);
      if (existing) {
        existing.dispose();
      }

      const instance = echarts.init(container, undefined, {
        renderer: 'canvas',
      });

      const option = chartConfig.renderOption(data, d1Color, d2Color, corners, false);
      instance.setOption(option);

      instance.group = 'apexdata-telemetry-group';

      // Deduplicated pointer listener: only notify parent when index actually advances
      instance.on('updateAxisPointer', (event: any) => {
        // When active playback is animating, don't let mouse hover events fight with playback
        if (isPlayingRef.current) return;

        if (!event.axesInfo || !event.axesInfo[0]) return;
        const dataIndex = event.axesInfo[0].value;
        if (
          dataIndex !== undefined &&
          dataIndex !== lastDispatchedIndexRef.current &&
          data.telemetry[dataIndex]
        ) {
          lastDispatchedIndexRef.current = dataIndex;
          onHoverPoint(data.telemetry[dataIndex]);
        }
      });

      instances[chartConfig.id] = instance;
      chartInstancesRef.current[chartConfig.id] = instance;
    });

    echarts.connect('apexdata-telemetry-group');

    const handleResize = () => {
      Object.values(instances).forEach((inst) => inst.resize());
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      Object.values(instances).forEach((inst) => inst.dispose());
    };
  }, [data, d1Color, d2Color, corners]);

  // Track isPlaying in ref for event handlers
  const isPlayingRef = useRef<boolean>(!!isPlaying);
  isPlayingRef.current = !!isPlaying;

  // Suppress/hide tooltips immediately when any modal or overlay opens
  useEffect(() => {
    if (isOverlayActive) {
      Object.values(chartInstancesRef.current).forEach((inst) => {
        if (inst && !inst.isDisposed()) {
          try {
            inst.dispatchAction({ type: 'hideTip' });
          } catch {
            // ignore
          }
        }
      });
      if (fullscreenInstanceRef.current && !fullscreenInstanceRef.current.isDisposed()) {
        try {
          fullscreenInstanceRef.current.dispatchAction({ type: 'hideTip' });
        } catch {
          // ignore
        }
      }
    }
  }, [isOverlayActive]);

  // Programmatically dispatch axis pointer / showTip when activePoint changes (e.g. during playback or scrubbing)
  useEffect(() => {
    if (isOverlayActive) return;
    if (!activePoint || activePoint.distance === undefined) return;

    // Find nearest telemetry index
    let sampleIdx = 0;
    let minDiff = Infinity;
    const targetDist = activePoint.distance;

    for (let i = 0; i < data.telemetry.length; i++) {
      const diff = Math.abs(data.telemetry[i].distance - targetDist);
      if (diff < minDiff) {
        minDiff = diff;
        sampleIdx = i;
      }
    }

    if (sampleIdx === lastDispatchedIndexRef.current && !isPlaying) return;
    lastDispatchedIndexRef.current = sampleIdx;

    // Dispatch showTip to one connected instance, which syncs across all connected charts in the group
    const firstInstanceKey = Object.keys(chartInstancesRef.current)[0];
    const firstInstance = chartInstancesRef.current[firstInstanceKey];

    if (firstInstance && !firstInstance.isDisposed()) {
      try {
        firstInstance.dispatchAction({
          type: 'showTip',
          seriesIndex: 0,
          dataIndex: sampleIdx,
        });
      } catch (err) {
        // Ignore during chart transitions/dispose
      }
    }

    if (fullscreenInstanceRef.current && !fullscreenInstanceRef.current.isDisposed()) {
      try {
        fullscreenInstanceRef.current.dispatchAction({
          type: 'showTip',
          seriesIndex: 0,
          dataIndex: sampleIdx,
        });
      } catch (err) {
        // Ignore
      }
    }
  }, [activePoint, data.telemetry, isPlaying, isOverlayActive]);

  // Fullscreen modal chart rendering
  useEffect(() => {
    if (!fullscreenChartId || !fullscreenContainerRef.current) return;

    const chartConfig = charts.find((c) => c.id === fullscreenChartId);
    if (!chartConfig) return;

    if (fullscreenInstanceRef.current) {
      fullscreenInstanceRef.current.dispose();
    }

    const fsInstance = echarts.init(fullscreenContainerRef.current, undefined, {
      renderer: 'canvas',
    });

    const option = chartConfig.renderOption(data, d1Color, d2Color, corners, true);
    fsInstance.setOption(option);

    fsInstance.on('updateAxisPointer', (event: any) => {
      if (!event.axesInfo || !event.axesInfo[0]) return;
      const dataIndex = event.axesInfo[0].value;
      if (
        dataIndex !== undefined &&
        dataIndex !== lastDispatchedIndexRef.current &&
        data.telemetry[dataIndex]
      ) {
        lastDispatchedIndexRef.current = dataIndex;
        onHoverPoint(data.telemetry[dataIndex]);
      }
    });

    fullscreenInstanceRef.current = fsInstance;

    const handleFsResize = () => {
      fsInstance.resize();
    };
    window.addEventListener('resize', handleFsResize);

    return () => {
      window.removeEventListener('resize', handleFsResize);
      fsInstance.dispose();
    };
  }, [fullscreenChartId, data, d1Color, d2Color, corners]);

  const handleExportChart = (
    chartId: string,
    format: 'png' | 'jpeg',
    resolutionMultiplier: number = 3
  ) => {
    const instance =
      fullscreenChartId === chartId && fullscreenInstanceRef.current
        ? fullscreenInstanceRef.current
        : chartInstancesRef.current[chartId];
    if (!instance) return;

    const dataUrl = instance.getDataURL({
      type: format,
      pixelRatio: resolutionMultiplier,
      backgroundColor: '#10131B',
      excludeComponents: ['dataZoom'],
    });

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `ApexData_${chartId.toUpperCase()}_${data.driver1.code}_vs_${data.driver2.code}_${data.summary.year}_${data.summary.gp}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFullscreenChart = charts.find((c) => c.id === fullscreenChartId);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-rows-2 gap-px bg-white/[0.06] h-full w-full">
        {charts.slice(0, 6).map((chart) => (
          <div
            key={chart.id}
            className="relative bg-[#050608] overflow-hidden flex flex-col h-full w-full"
          >
              {/* Ultra-Minimal Micro Label Bar inside top of chart */}
              <div className="absolute top-1 left-2 z-10 flex items-center gap-2 pointer-events-none text-[9px] font-mono">
                <span className="text-slate-400 font-bold uppercase tracking-wider">
                  {chart.title.split(' ')[0]}
                </span>
                <span className="text-slate-600">[{chart.unit}]</span>
                <span className="text-slate-600">|</span>
                <span style={{ color: d1Color }} className="font-bold">{data.driver1.code}</span>
                <span style={{ color: d2Color }} className="font-bold">{data.driver2.code}</span>
              </div>

              {/* Action Buttons Top Right - Fullscreen Pop-up only */}
              <div className="absolute top-1 right-1 z-20 flex items-center gap-1">
                <button
                  onClick={() => setFullscreenChartId(chart.id)}
                  title="Pop-up Fullscreen Graph (includes HQ download)"
                  className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Chart Canvas Area */}
              <div
                ref={(el) => (chartContainersRef.current[chart.id] = el)}
                className="w-full h-full flex-1"
              />
            </div>
          ))}
      </div>

      {/* Full-Screen Pop-up Modal for Graph */}
      {fullscreenChartId && activeFullscreenChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
          <div className="bg-[#10131B] border border-f1-border rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141722]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-4 bg-[#FF6A00] rounded-sm"></span>
                <div>
                  <h2 className="font-orbitron font-bold text-base text-white tracking-wider flex items-center gap-2">
                    {activeFullscreenChart.title}
                    <span className="text-xs font-mono text-slate-400 font-normal">
                      [{activeFullscreenChart.unit}]
                    </span>
                  </h2>
                  <p className="text-xs font-mono text-slate-400">
                    {data.summary.year} {data.summary.gp} ({data.summary.session}) • {data.driver1.code} vs {data.driver2.code}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-black/40"
                      style={{ backgroundColor: d1Color }}
                    ></span>
                    <span className="text-white font-bold">{data.driver1.code}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-black/40"
                      style={{ backgroundColor: d2Color }}
                    ></span>
                    <span className="text-white font-bold">{data.driver2.code}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleExportChart(activeFullscreenChart.id, 'png', 3)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#FF6A00]" />
                  <span>EXPORT HQ</span>
                </button>

                <button
                  onClick={() => setFullscreenChartId(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded bg-white/5 hover:bg-white/15 transition-colors cursor-pointer"
                  title="Close Fullscreen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Canvas */}
            <div className="flex-1 p-4 bg-[#0A0C12] relative min-h-[480px]">
              <div
                ref={fullscreenContainerRef}
                className="w-full h-full min-h-[480px]"
                style={{ width: '100%', height: '520px' }}
              />
            </div>

            {/* Modal Footer with Instructions */}
            <div className="px-6 py-2.5 bg-[#141722] border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Flag className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Turn apexes are labeled (T1, T2...) along track distance. Use mouse wheel / scroll to zoom into telemetry segments.</span>
              </div>
              <button
                onClick={() => setFullscreenChartId(null)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-colors"
              >
                ESC / CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
