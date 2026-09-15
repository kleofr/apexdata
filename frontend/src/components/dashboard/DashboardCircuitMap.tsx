import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, RefreshCw, Compass } from 'lucide-react';
import { CircuitDetails, TrackGeometry } from '../../types/dashboard';
import { useTheme } from '../../context/ThemeContext';

interface DashboardCircuitMapProps {
  circuit: CircuitDetails;
  trackGeometry?: TrackGeometry;
  year?: number;
}

export const DashboardCircuitMap: React.FC<DashboardCircuitMapProps> = ({
  circuit,
  trackGeometry,
}) => {
  const { theme } = useTheme();
  const [showCorners, setShowCorners] = useState<boolean>(true);
  const [showDrs, setShowDrs] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hoveredSample, setHoveredSample] = useState<any | null>(null);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const trackSamples = trackGeometry?.track_samples || [];
  const corners = trackGeometry?.corners || [];
  const drsZones = circuit.drs_zones || [];

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoomLevel((prev) => Math.min(Math.max(0.6, prev * zoomFactor), 4.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && zoomLevel > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Process geometry into SVG screen coordinates
  const { pathSegments, trackPathString, startFinish, transformedCorners, transformedDrs, svgDim } =
    useMemo(() => {
      const defaultReturn = {
        pathSegments: [],
        trackPathString: '',
        startFinish: null,
        transformedCorners: [],
        transformedDrs: [],
        svgDim: { width: 1000, height: 750 },
      };

      if (!trackSamples || trackSamples.length < 2) return defaultReturn;

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      trackSamples.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });

      const rawSpanX = maxX - minX || 1;
      const rawSpanY = maxY - minY || 1;

      const targetW = 1000;
      const targetH = 750;
      const pad = 48;
      const availW = targetW - pad * 2;
      const availH = targetH - pad * 2;
      const scale = Math.min(availW / rawSpanX, availH / rawSpanY);

      const offsetX = pad + (availW - rawSpanX * scale) / 2;
      const offsetY = pad + (availH - rawSpanY * scale) / 2;

      const toScreen = (x: number, y: number) => ({
        x: offsetX + (x - minX) * scale,
        y: targetH - (offsetY + (y - minY) * scale),
      });

      const screenPts = trackSamples.map((p) => {
        const s = toScreen(p.x, p.y);
        return {
          ...p,
          sx: s.x,
          sy: s.y,
        };
      });

      // Path segments with speed heatmap gradient
      const segments = [];
      const speeds = screenPts.map((p) => p.speed);
      const minSpeed = Math.min(...speeds) || 70;
      const maxSpeed = Math.max(...speeds) || 310;
      const speedSpan = maxSpeed - minSpeed || 1;

      for (let i = 0; i < screenPts.length - 1; i++) {
        const p1 = screenPts[i];
        const p2 = screenPts[i + 1];
        const ratio = (p1.speed - minSpeed) / speedSpan;
        // High speed = Team Primary Color, Low speed = Teal/Cyan
        const color = ratio > 0.6 ? theme.primaryColor : ratio > 0.3 ? '#00F0FF' : '#3B82F6';

        segments.push({
          x1: p1.sx,
          y1: p1.sy,
          x2: p2.sx,
          y2: p2.sy,
          color,
          point: p1,
        });
      }

      if (screenPts.length > 2) {
        const last = screenPts[screenPts.length - 1];
        const first = screenPts[0];
        segments.push({
          x1: last.sx,
          y1: last.sy,
          x2: first.sx,
          y2: first.sy,
          color: theme.primaryColor,
          point: last,
        });
      }

      const d = [`M ${screenPts[0].sx.toFixed(1)} ${screenPts[0].sy.toFixed(1)}`];
      for (let i = 1; i < screenPts.length; i++) {
        d.push(`L ${screenPts[i].sx.toFixed(1)} ${screenPts[i].sy.toFixed(1)}`);
      }
      d.push('Z');
      const trackPath = d.join(' ');

      // Start/Finish Line
      let sfLine = null;
      if (screenPts.length >= 2) {
        const p1 = screenPts[0];
        const p2 = screenPts[1];
        const dx = p2.sx - p1.sx;
        const dy = p2.sy - p1.sy;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const barHalf = 18;
        sfLine = {
          x1: p1.sx - nx * barHalf,
          y1: p1.sy - ny * barHalf,
          x2: p1.sx + nx * barHalf,
          y2: p1.sy + ny * barHalf,
        };
      }

      // Corners
      const tCorners = corners.map((c) => {
        let cx: number;
        let cy: number;
        if (c.x !== undefined && c.y !== undefined) {
          const s = toScreen(c.x, c.y);
          cx = s.x;
          cy = s.y;
        } else {
          const nearest = screenPts.reduce((prev, curr) =>
            Math.abs(curr.distance - c.distance) < Math.abs(prev.distance - c.distance) ? curr : prev
          );
          cx = nearest.sx;
          cy = nearest.sy;
        }
        return {
          ...c,
          screenX: cx,
          screenY: cy,
        };
      });

      // DRS Zones Screen mapping
      const tDrs = drsZones.map((zone) => {
        const nearestDet = screenPts.reduce((prev, curr) =>
          Math.abs(curr.distance - zone.detection_distance_m) < Math.abs(prev.distance - zone.detection_distance_m)
            ? curr
            : prev
        );
        const nearestAct = screenPts.reduce((prev, curr) =>
          Math.abs(curr.distance - zone.start_distance_m) < Math.abs(prev.distance - zone.start_distance_m)
            ? curr
            : prev
        );
        return {
          ...zone,
          detectionPos: { x: nearestDet.sx, y: nearestDet.sy },
          activationPos: { x: nearestAct.sx, y: nearestAct.sy },
        };
      });

      return {
        pathSegments: segments,
        trackPathString: trackPath,
        startFinish: sfLine,
        transformedCorners: tCorners,
        transformedDrs: tDrs,
        svgDim: { width: targetW, height: targetH },
      };
    }, [trackSamples, corners, drsZones, theme.primaryColor]);

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col bg-transparent overflow-hidden select-none font-mono relative ${
        isFullscreen ? 'fixed inset-0 z-50 p-2 bg-[#050608]' : ''
      }`}
    >
      {/* Circuit Header Bar (Card-less) */}
      <div className="px-2 py-1 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5" style={{ color: theme.primaryColor }} />
          <div>
            <div className="font-orbitron font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>{circuit.name}</span>
            </div>
            <div className="text-[9px] text-slate-400">
              {circuit.location} &bull; {circuit.length_km} KM &bull; {circuit.turns} TURNS
            </div>
          </div>
        </div>

        {/* Action / Toggle Buttons */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <button
            onClick={() => setShowCorners(!showCorners)}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              showCorners
                ? 'bg-white/15 text-white border-white/30 font-bold'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
          >
            CORNERS ({corners.length || circuit.turns})
          </button>

          <button
            onClick={() => setShowDrs(!showDrs)}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              showDrs
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
          >
            DRS ({circuit.drs_zones_count} ZONES)
          </button>

          <button
            onClick={handleResetZoom}
            title="Reset Zoom & Pan"
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex-1 min-h-0 relative overflow-hidden flex items-center justify-center p-2 ${
          zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
        }`}
      >
        {pathSegments.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-500 text-xs space-y-1">
            <Compass className="w-8 h-8 opacity-40 animate-pulse" />
            <div>Generating high-precision circuit spline for {circuit.name}...</div>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${svgDim.width} ${svgDim.height}`}
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <pattern
                id="dashboard-dotted-grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="12" cy="12" r="1.2" fill="#3B82F6" fillOpacity="0.14" />
              </pattern>
            </defs>

            <rect width="100%" height="100%" fill="url(#dashboard-dotted-grid)" />

            <g
              transform={`translate(${svgDim.width / 2 + panOffset.x}, ${svgDim.height / 2 + panOffset.y}) scale(${zoomLevel}) translate(-${svgDim.width / 2}, -${svgDim.height / 2})`}
            >
              {/* Thick Roadbed */}
              <path
                d={trackPathString}
                fill="none"
                stroke="#07090E"
                strokeWidth="28"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={trackPathString}
                fill="none"
                stroke="#1A1F2C"
                strokeWidth="20"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={trackPathString}
                fill="none"
                stroke="#2B3448"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Speed Heatmap Racing Line */}
              {pathSegments.map((seg, idx) => (
                <line
                  key={idx}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={seg.color}
                  strokeWidth="7"
                  strokeLinecap="round"
                  onMouseEnter={() => setHoveredSample(seg.point)}
                />
              ))}

              {/* Start / Finish Line */}
              {startFinish && (
                <line
                  x1={startFinish.x1}
                  y1={startFinish.y1}
                  x2={startFinish.x2}
                  y2={startFinish.y2}
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  strokeLinecap="square"
                />
              )}

              {/* Numbered Corner Apex Badges */}
              {showCorners &&
                transformedCorners.map((c) => (
                  <g key={`c-${c.number}-${c.letter}`} transform={`translate(${c.screenX}, ${c.screenY})`}>
                    <circle r="9" fill="#0A0D14" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {c.number}
                    </text>
                  </g>
                ))}

              {/* DRS Zones Detection and Activation Overlays */}
              {showDrs &&
                transformedDrs.map((drs) => (
                  <g key={`drs-${drs.id}`}>
                    {/* Detection Marker */}
                    <g transform={`translate(${drs.detectionPos.x}, ${drs.detectionPos.y})`}>
                      <circle r="7" fill="#00F0FF" fillOpacity="0.3" stroke="#00F0FF" strokeWidth="1.5" />
                      <text
                        y="-11"
                        textAnchor="middle"
                        fill="#00F0FF"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        DET {drs.id}
                      </text>
                    </g>
                    {/* Activation / Overtake Marker */}
                    <g transform={`translate(${drs.activationPos.x}, ${drs.activationPos.y})`}>
                      <circle r="7" fill="#10B981" fillOpacity="0.3" stroke="#10B981" strokeWidth="1.5" />
                      <text
                        y="14"
                        textAnchor="middle"
                        fill="#10B981"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        DRS {drs.id}
                      </text>
                    </g>
                  </g>
                ))}
            </g>
          </svg>
        )}

        {/* Bottom Legend Overlay */}
        <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-3 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded border border-white/10 text-[10px] text-slate-300 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
            <span>HIGH VELOCITY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 rounded-full bg-cyan-400" />
            <span>MID-CORNER</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 rounded-full bg-blue-500" />
            <span>HEAVY BRAKING</span>
          </div>
          {hoveredSample && (
            <div className="border-l border-white/15 pl-2 text-white font-bold">
              SPEED: {hoveredSample.speed} KM/H &bull; GEAR {hoveredSample.gear}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
