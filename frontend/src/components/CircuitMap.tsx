import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Maximize2, X } from 'lucide-react';
import { ComparisonData, TelemetryPoint } from '../types/telemetry';
import { UseLapPlaybackReturn } from '../hooks/useLapPlayback';
import { PlaybackControls } from './PlaybackControls';

interface CircuitMapProps {
  data: ComparisonData;
  hoveredPoint: TelemetryPoint | null;
  onHoverPoint: (point: TelemetryPoint | null) => void;
  d1Color: string;
  d2Color: string;
  playback?: UseLapPlaybackReturn;
  isFullscreen?: boolean;
  onToggleFullscreen?: (fullscreen: boolean) => void;
}

export type DeltaMode = 'cumulative' | 'speed';

export const CircuitMap: React.FC<CircuitMapProps> = ({
  data,
  hoveredPoint,
  onHoverPoint,
  d1Color,
  d2Color,
  playback,
  isFullscreen: controlledFullscreen,
  onToggleFullscreen,
}) => {
  const [deltaMode, setDeltaMode] = useState<DeltaMode>('cumulative');
  const [showCorners, setShowCorners] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [internalFullscreen, setInternalFullscreen] = useState<boolean>(false);

  const isFullscreen = controlledFullscreen !== undefined ? controlledFullscreen : internalFullscreen;
  const setFullscreen = (value: boolean) => {
    setInternalFullscreen(value);
    onToggleFullscreen?.(value);
  };

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close fullscreen on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const telemetry = data.telemetry || [];
  const corners = data.corners || [];

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoomLevel((prev) => Math.min(Math.max(0.6, prev * zoomFactor), 5));
  };

  // Reset zoom
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && zoomLevel > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
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

  // Normalize coordinates into an SVG view space with crisp aspect ratio and proper roadbed width
  const { pathSegments, trackPathString, startFinish, transformedCorners, d1Coord, d2Coord, isD1Ahead, svgDim } =
    useMemo(() => {
      const defaultReturn = {
        pathSegments: [],
        trackPathString: '',
        startFinish: null,
        transformedCorners: [],
        currentHoverCoord: null,
        d1Coord: null,
        d2Coord: null,
        isD1Ahead: true,
        svgDim: { width: 1000, height: 750 },
      };

      if (!telemetry || telemetry.length < 2) return defaultReturn;

      const validPts = telemetry.filter((p) => p.x !== undefined && p.y !== undefined);
      if (validPts.length < 2) return defaultReturn;

      // Find bounding box of raw rotated coordinates
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      validPts.forEach((p) => {
        const x = p.x!;
        const y = p.y!;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });

      const rawSpanX = maxX - minX || 1;
      const rawSpanY = maxY - minY || 1;

      // Normalization preserving true geometry into uniform 1000x750 canvas with tight auto-fit
      const targetW = 1000;
      const targetH = 750;
      const pad = 45; // tight padding so track is large and prominent
      const availW = targetW - pad * 2;
      const availH = targetH - pad * 2;
      const scale = Math.min(availW / rawSpanX, availH / rawSpanY);

      // Centering offsets
      const midRawX = (minX + maxX) / 2;
      const midRawY = (minY + maxY) / 2;
      const canvasMidX = targetW / 2;
      const canvasMidY = targetH / 2;

      // Transform raw (x, y) to screen coords
      const toScreen = (rx: number, ry: number) => ({
        x: canvasMidX + (rx - midRawX) * scale,
        y: canvasMidY - (ry - midRawY) * scale,
      });

      // Project all telemetry points to screen coords
      const screenPts = validPts.map((p) => {
        const s = toScreen(p.x!, p.y!);
        return {
          ...p,
          sx: s.x,
          sy: s.y,
        };
      });

      // Delta color function
      const getDeltaColor = (p: TelemetryPoint): string => {
        if (deltaMode === 'cumulative') {
          const delta = p.delta;
          if (Math.abs(delta) < 0.02) return '#94A3B8';
          return delta < 0 ? d1Color : d2Color;
        } else {
          const speedDiff = p.speed1 - p.speed2;
          if (Math.abs(speedDiff) < 1.5) return '#94A3B8';
          return speedDiff > 0 ? d1Color : d2Color;
        }
      };

      // Multi-color path segments
      const segments = [];
      for (let i = 0; i < screenPts.length - 1; i++) {
        const p1 = screenPts[i];
        const p2 = screenPts[i + 1];
        segments.push({
          x1: p1.sx,
          y1: p1.sy,
          x2: p2.sx,
          y2: p2.sy,
          color: getDeltaColor(p1),
          point: p1,
        });
      }
      // Close circuit loop
      if (screenPts.length > 2) {
        const last = screenPts[screenPts.length - 1];
        const first = screenPts[0];
        segments.push({
          x1: last.sx,
          y1: last.sy,
          x2: first.sx,
          y2: first.sy,
          color: getDeltaColor(last),
          point: last,
        });
      }

      // Continuous roadbed path
      const d = [`M ${screenPts[0].sx.toFixed(1)} ${screenPts[0].sy.toFixed(1)}`];
      for (let i = 1; i < screenPts.length; i++) {
        d.push(`L ${screenPts[i].sx.toFixed(1)} ${screenPts[i].sy.toFixed(1)}`);
      }
      d.push('Z');
      const trackPath = d.join(' ');

      // Start/Finish line
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

      // Corner Badges positioned right at the turn apexes
      const tCorners = corners.map((c) => {
        let cx: number;
        let cy: number;

        const nearest = screenPts.reduce((prev, curr) =>
          Math.abs(curr.distance - c.distance) < Math.abs(prev.distance - c.distance) ? curr : prev
        );

        if (c.x !== undefined && c.y !== undefined) {
          const s = toScreen(c.x, c.y);
          cx = s.x;
          cy = s.y;
        } else {
          cx = nearest.sx;
          cy = nearest.sy;
        }

        return {
          ...c,
          screenX: cx,
          screenY: cy,
        };
      });

      // Exact continuous interpolation along the track geometry:
      // Finds the precise (x, y) coordinates along screenPts segments for any distance (meters),
      // guaranteeing the car dots strictly follow the circuit spline and don't jump/cut across turns.
      const interpolateTrackPosition = (targetDist: number): { x: number; y: number } | null => {
        if (screenPts.length === 0) return null;
        if (targetDist <= screenPts[0].distance) {
          return { x: screenPts[0].sx, y: screenPts[0].sy };
        }
        if (targetDist >= screenPts[screenPts.length - 1].distance) {
          const last = screenPts[screenPts.length - 1];
          return { x: last.sx, y: last.sy };
        }

        // Binary search for segment [low, low + 1]
        let low = 0;
        let high = screenPts.length - 1;
        while (low <= high) {
          const mid = (low + high) >> 1;
          if (screenPts[mid].distance <= targetDist) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        const idx1 = Math.max(0, low - 1);
        const idx2 = Math.min(screenPts.length - 1, low);
        if (idx1 === idx2) {
          return { x: screenPts[idx1].sx, y: screenPts[idx1].sy };
        }

        const p1 = screenPts[idx1];
        const p2 = screenPts[idx2];
        const span = p2.distance - p1.distance;
        if (span <= 0) {
          return { x: p1.sx, y: p1.sy };
        }

        const t = Math.max(0, Math.min(1, (targetDist - p1.distance) / span));
        return {
          x: p1.sx + (p2.sx - p1.sx) * t,
          y: p1.sy + (p2.sy - p1.sy) * t,
        };
      };

      // Current Driver 1 and Driver 2 Coordinates
      let d1Coord: { x: number; y: number; point: TelemetryPoint } | null = null;
      let d2Coord: { x: number; y: number; distance: number } | null = null;

      if (hoveredPoint && hoveredPoint.distance !== undefined) {
        // Driver 1 exact position on track
        const d1Pos = interpolateTrackPosition(hoveredPoint.distance);
        if (d1Pos) {
          d1Coord = {
            x: d1Pos.x,
            y: d1Pos.y,
            point: hoveredPoint,
          };

          // Driver 2 position calculation:
          // In F1 telemetry delta convention: delta = t1 - t2.
          // If delta < 0, Driver 1 took LESS time to reach this distance -> Driver 1 is ahead.
          // Therefore, at Driver 1's elapsed time, Driver 2 has covered LESS distance and is BEHIND Driver 1.
          // Since delta < 0, hoveredPoint.distance + (delta * speed) correctly subtracts distance (d2Distance < d1Distance).
          // If delta > 0, Driver 1 took MORE time -> Driver 2 is ahead, so d2Distance > d1Distance.
          const d2SpeedMs = Math.max(10, (hoveredPoint.speed2 || 150) * (1000 / 3600));
          const maxTrackDist = telemetry[telemetry.length - 1].distance;
          const d2Distance = Math.max(
            0,
            Math.min(
              maxTrackDist,
              hoveredPoint.distance + (hoveredPoint.delta * d2SpeedMs)
            )
          );

          const d2Pos = interpolateTrackPosition(d2Distance);
          if (d2Pos) {
            d2Coord = {
              x: d2Pos.x,
              y: d2Pos.y,
              distance: d2Distance,
            };
          }
        }
      }

      // Determine who is ahead based on the delta at current point:
      // delta = t1 - t2. If delta <= 0, Driver 1 took less elapsed time to reach this distance (D1 ahead).
      const isD1Ahead = hoveredPoint ? hoveredPoint.delta <= 0 : true;

      return {
        pathSegments: segments,
        trackPathString: trackPath,
        startFinish: sfLine,
        transformedCorners: tCorners,
        currentHoverCoord: d1Coord,
        d1Coord,
        d2Coord,
        isD1Ahead,
        svgDim: { width: targetW, height: targetH },
      };
    }, [telemetry, corners, deltaMode, d1Color, d2Color, hoveredPoint]);

  // Continuous smooth scrubbing calculation on SVG (taking zoom & pan into account)
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    // When playback replay is actively running, do not let cursor hover override playback positions
    if (playback?.isPlaying) return;
    if (!svgDim || !telemetry || telemetry.length < 2 || isDragging) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    // Inverse transform relative to zoom and pan
    const canvasCenterX = svgDim.width / 2;
    const canvasCenterY = svgDim.height / 2;
    const realX = (svgP.x - canvasCenterX - panOffset.x) / zoomLevel + canvasCenterX;
    const realY = (svgP.y - canvasCenterY - panOffset.y) / zoomLevel + canvasCenterY;

    // Find closest point by Euclidean distance in screen space
    let closestPt: TelemetryPoint | null = null;
    let minDist = Infinity;

    for (let i = 0; i < pathSegments.length; i++) {
      const seg = pathSegments[i];
      const dX = seg.x1 - realX;
      const dY = seg.y1 - realY;
      const dist = dX * dX + dY * dY;
      if (dist < minDist) {
        minDist = dist;
        closestPt = seg.point;
      }
    }

    if (closestPt && minDist < 35000) {
      onHoverPoint(closestPt);
    }
  };

  const handlePointerLeave = () => {
    // If playing or scrubbing, preserve the active playback point
    if (playback?.isPlaying) return;
    // Keep last inspected point rather than flashing/resetting to null, or reset only when not playing
    // onHoverPoint(null);
  };

  return (
    <div
      ref={containerRef}
      className="bg-transparent p-1 flex flex-col h-full relative overflow-hidden text-[10px] font-mono select-none"
    >
      {/* Header bar (Card-less) */}
      <div className="flex items-center justify-between pb-0.5 mb-0.5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">
            TRACK MAP // {data.summary.gp.toUpperCase()}
          </span>
        </div>

        {/* Dual Mode Switcher & Corner Toggle & Zoom Controls */}
        <div className="flex items-center gap-1.5 text-[9px]">
          {/* Zoom controls */}
          <div className="flex items-center bg-black/40 rounded px-1 py-0.2 border border-white/5 gap-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(5, z * 1.25))}
              title="Zoom In (or Scroll Wheel)"
              className="px-1 text-slate-400 hover:text-white font-bold"
            >
              +
            </button>
            <span className="text-[8px] text-slate-500 font-mono min-w-[28px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z * 0.8))}
              title="Zoom Out (or Scroll Wheel)"
              className="px-1 text-slate-400 hover:text-white font-bold"
            >
              -
            </button>
            {zoomLevel !== 1 && (
              <button
                onClick={handleResetZoom}
                title="Reset Zoom"
                className="text-[8px] text-[#FF6A00] hover:underline ml-0.5"
              >
                RESET
              </button>
            )}
          </div>

          <button
            onClick={() => setShowCorners(!showCorners)}
            className={`px-1 py-0.2 rounded border transition-colors ${
              showCorners
                ? 'bg-white/10 border-white/20 text-white font-bold'
                : 'bg-transparent border-white/5 text-slate-500 hover:text-white'
            }`}
            title="Toggle Turn Badges"
          >
            TURNS
          </button>

          <div className="flex items-center bg-black/40 rounded p-0.2 border border-white/5 text-[9px]">
            <button
              onClick={() => setDeltaMode('cumulative')}
              className={`px-1.5 py-0.2 rounded transition-colors ${
                deltaMode === 'cumulative'
                  ? 'bg-[#FF6A00] text-black font-bold'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              CUMULATIVE Δ
            </button>
            <button
              onClick={() => setDeltaMode('speed')}
              className={`px-1.5 py-0.2 rounded transition-colors ${
                deltaMode === 'speed'
                  ? 'bg-[#FF6A00] text-black font-bold'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              SPEED Δ
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={() => setFullscreen(true)}
            title="Full-Screen Circuit Map with Playback Controls"
            className="p-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Map SVG Canvas with Dotted Radar Grid Background & Scroll Wheel Zoom */}
      <div
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex-1 w-full min-h-0 relative flex items-center justify-center overflow-hidden ${
          zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
        }`}
      >
        {pathSegments.length === 0 ? (
          <div className="text-slate-500 font-mono text-xs text-center">
            No circuit telemetry coordinates available.
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${svgDim.width} ${svgDim.height}`}
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            {/* Definitions: Low-Opacity Dotted Motorsport Radar Grid & Filter for car behind */}
            <defs>
              <pattern
                id="circuit-dotted-grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="12" cy="12" r="1.2" fill="#3B82F6" fillOpacity="0.16" />
              </pattern>
              {/* Grayscale + Dimmed Filter for Chasing Driver (Trailing Car) */}
              <filter id="car-behind-dim">
                <feColorMatrix
                  type="matrix"
                  values="0.3333 0.3333 0.3333 0 0
                          0.3333 0.3333 0.3333 0 0
                          0.3333 0.3333 0.3333 0 0
                          0      0      0      0.7 0"
                />
              </filter>
            </defs>

            {/* Dotted Grid Background Layer */}
            <rect width="100%" height="100%" fill="url(#circuit-dotted-grid)" />

            {/* Interactive Transform Group for Zoom & Pan */}
            <g
              transform={`translate(${svgDim.width / 2 + panOffset.x}, ${svgDim.height / 2 + panOffset.y}) scale(${zoomLevel}) translate(-${svgDim.width / 2}, -${svgDim.height / 2})`}
            >
              {/* 1. Base Asphalt Roadbed (Dense, thick, authentic track thickness) */}
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

              {/* 2. Color-Coded Delta Racing Core */}
              {pathSegments.map((seg, idx) => (
                <line
                  key={idx}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={seg.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              ))}

              {/* Transparent wide path overlay for frictionless hit testing */}
              <path
                d={trackPathString}
                fill="none"
                stroke="transparent"
                strokeWidth="32"
              />

              {/* 3. Start / Finish Line */}
              {startFinish && (
                <line
                  x1={startFinish.x1}
                  y1={startFinish.y1}
                  x2={startFinish.x2}
                  y2={startFinish.y2}
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  strokeDasharray="5 3"
                />
              )}

              {/* 4. Turn Apex Badges */}
              {showCorners &&
                transformedCorners.map((corner, idx) => (
                  <g key={idx} transform={`translate(${corner.screenX}, ${corner.screenY})`} className="pointer-events-none">
                    <circle r="14" fill="#090B10" stroke="#64748B" strokeWidth="1.8" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="Orbitron, monospace"
                    >
                      {corner.number}
                    </text>
                  </g>
                ))}

              {/* 5. Live Car Scrub Cursor Dots (Driver ahead is rendered on top; trailing driver is grayscaled & dimmed) */}
              {(() => {
                const renderD1 = (
                  <g
                    key="d1-dot"
                    transform={d1Coord ? `translate(${d1Coord.x}, ${d1Coord.y})` : undefined}
                    className="pointer-events-none transition-opacity duration-150"
                    filter={!isD1Ahead ? 'url(#car-behind-dim)' : undefined}
                    opacity={!isD1Ahead ? 0.6 : 1}
                  >
                    {/* Outer glow halo */}
                    <circle r={isD1Ahead ? 18 : 12} fill={d1Color} opacity={isD1Ahead ? 0.4 : 0.15} />
                    {/* Car dot */}
                    <circle
                      r={isD1Ahead ? 8.5 : 6.5}
                      fill={d1Color}
                      stroke="#FFFFFF"
                      strokeWidth={isD1Ahead ? 2.5 : 1.5}
                    />
                    {/* Driver Label Tag */}
                    <rect
                      x="-36"
                      y="-8"
                      width="26"
                      height="14"
                      rx="3"
                      fill="#090B10"
                      fillOpacity="0.9"
                      stroke={d1Color}
                      strokeWidth="1"
                    />
                    <text
                      x="-23"
                      y="0"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="Orbitron, monospace"
                    >
                      {data.driver1.code}
                    </text>
                  </g>
                );

                const renderD2 = (
                  <g
                    key="d2-dot"
                    transform={d2Coord ? `translate(${d2Coord.x}, ${d2Coord.y})` : undefined}
                    className="pointer-events-none transition-opacity duration-150"
                    filter={isD1Ahead ? 'url(#car-behind-dim)' : undefined}
                    opacity={isD1Ahead ? 0.6 : 1}
                  >
                    {/* Outer halo */}
                    <circle r={!isD1Ahead ? 18 : 12} fill={d2Color} opacity={!isD1Ahead ? 0.4 : 0.15} />
                    {/* Car dot */}
                    <circle
                      r={!isD1Ahead ? 8.5 : 6.5}
                      fill={d2Color}
                      stroke="#FFFFFF"
                      strokeWidth={!isD1Ahead ? 2.5 : 1.5}
                    />
                    {/* Driver Label Tag */}
                    <rect
                      x="10"
                      y="-8"
                      width="26"
                      height="14"
                      rx="3"
                      fill="#090B10"
                      fillOpacity="0.9"
                      stroke={d2Color}
                      strokeWidth="1"
                    />
                    <text
                      x="23"
                      y="0"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="Orbitron, monospace"
                    >
                      {data.driver2.code}
                    </text>
                  </g>
                );

                // Render chasing driver first, leading driver second (so leading driver is visibly ON TOP)
                return (
                  <>
                    {isD1Ahead ? (
                      <>
                        {d2Coord && renderD2}
                        {d1Coord && renderD1}
                      </>
                    ) : (
                      <>
                        {d1Coord && renderD1}
                        {d2Coord && renderD2}
                      </>
                    )}
                  </>
                );
              })()}
            </g>
          </svg>
        )}
      </div>

      {/* Footer Legend & Status */}
      <div className="pt-1 mt-0.5 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-slate-300 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-full border border-black/40"
              style={{ backgroundColor: d1Color }}
            />
            <span className="font-bold text-white">{data.driver1.code}</span>
            <span className="text-slate-400">
              {deltaMode === 'cumulative' ? 'Cumulative Δ' : 'Speed Δ'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-full border border-black/40"
              style={{ backgroundColor: d2Color }}
            />
            <span className="font-bold text-white">{data.driver2.code}</span>
            <span className="text-slate-400">
              {deltaMode === 'cumulative' ? 'Cumulative Δ' : 'Speed Δ'}
            </span>
          </div>
        </div>

        {/* Dynamic coordinate readout */}
        {hoveredPoint && (
          <div className="flex items-center gap-1.5 text-white font-orbitron text-[10px]">
            <span className="text-slate-400 font-mono text-[9px]">DIST:</span>
            <span>{Math.round(hoveredPoint.distance)}m</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[9px]">Δ:</span>
            <span className={hoveredPoint.delta <= 0 ? 'text-[#00E676]' : 'text-[#FF1744]'}>
              {hoveredPoint.delta <= 0
                ? `${hoveredPoint.delta.toFixed(3)}s`
                : `+${hoveredPoint.delta.toFixed(3)}s`}
            </span>
          </div>
        )}
      </div>

      {/* FULL-SCREEN CIRCUIT MAP POP-UP MODAL WITH PLAY/PAUSE & TIME SCRUB BAR */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-[#0B0D13] border border-white/20 rounded-lg shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#121520] shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-4 bg-[#FF6A00] rounded-sm"></span>
                <div>
                  <h2 className="font-orbitron font-bold text-sm text-white tracking-wider flex items-center gap-2">
                    CIRCUIT MAP // {data.summary.gp.toUpperCase()}
                    <span className="text-xs font-mono text-slate-400 font-normal">
                      ({data.summary.year} {data.summary.session})
                    </span>
                  </h2>
                  <p className="text-[10px] font-mono text-slate-400">
                    {data.driver1.code} vs {data.driver2.code} • Track Length: {Math.round(data.summary.track_length)}m
                  </p>
                </div>
              </div>

              {/* Header Controls: Zoom, Turns, Delta Mode, Close */}
              <div className="flex items-center gap-2 text-[10px] font-mono">
                {/* Zoom controls */}
                <div className="flex items-center bg-black/40 rounded px-1.5 py-0.5 border border-white/10 gap-1.5">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(5, z * 1.25))}
                    title="Zoom In"
                    className="px-1 text-slate-300 hover:text-white font-bold"
                  >
                    +
                  </button>
                  <span className="text-[9px] text-slate-400 font-mono min-w-[32px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.6, z * 0.8))}
                    title="Zoom Out"
                    className="px-1 text-slate-300 hover:text-white font-bold"
                  >
                    -
                  </button>
                  {zoomLevel !== 1 && (
                    <button
                      onClick={handleResetZoom}
                      title="Reset Zoom"
                      className="text-[9px] text-[#FF6A00] hover:underline ml-1 font-bold"
                    >
                      RESET
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowCorners(!showCorners)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    showCorners
                      ? 'bg-white/10 border-white/20 text-white font-bold'
                      : 'bg-transparent border-white/5 text-slate-500 hover:text-white'
                  }`}
                >
                  TURNS
                </button>

                <div className="flex items-center bg-black/40 rounded p-0.5 border border-white/10">
                  <button
                    onClick={() => setDeltaMode('cumulative')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      deltaMode === 'cumulative'
                        ? 'bg-[#FF6A00] text-black font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    CUMULATIVE Δ
                  </button>
                  <button
                    onClick={() => setDeltaMode('speed')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      deltaMode === 'speed'
                        ? 'bg-[#FF6A00] text-black font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    SPEED Δ
                  </button>
                </div>

                <button
                  onClick={() => setFullscreen(false)}
                  title="Close Fullscreen (Esc)"
                  className="p-1 text-slate-400 hover:text-white rounded bg-white/5 hover:bg-white/15 transition-colors cursor-pointer ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Canvas: Large Circuit Outline */}
            <div
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className={`flex-1 w-full min-h-0 relative flex items-center justify-center overflow-hidden bg-[#07080B] ${
                zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
              }`}
            >
              <svg
                viewBox={`0 0 ${svgDim.width} ${svgDim.height}`}
                className="w-full h-full select-none"
                preserveAspectRatio="xMidYMid meet"
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              >
                <defs>
                  <pattern
                    id="circuit-dotted-grid-modal"
                    width="24"
                    height="24"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="12" cy="12" r="1.2" fill="#3B82F6" fillOpacity="0.16" />
                  </pattern>
                  {/* Grayscale + Dimmed Filter for Chasing Driver (Trailing Car) in modal */}
                  <filter id="car-behind-dim-modal">
                    <feColorMatrix
                      type="matrix"
                      values="0.3333 0.3333 0.3333 0 0
                              0.3333 0.3333 0.3333 0 0
                              0.3333 0.3333 0.3333 0 0
                              0      0      0      0.7 0"
                    />
                  </filter>
                </defs>

                <rect width="100%" height="100%" fill="url(#circuit-dotted-grid-modal)" />

                <g
                  transform={`translate(${svgDim.width / 2 + panOffset.x}, ${svgDim.height / 2 + panOffset.y}) scale(${zoomLevel}) translate(-${svgDim.width / 2}, -${svgDim.height / 2})`}
                >
                  {/* Roadbed */}
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

                  {/* Racing Core */}
                  {pathSegments.map((seg, idx) => (
                    <line
                      key={idx}
                      x1={seg.x1}
                      y1={seg.y1}
                      x2={seg.x2}
                      y2={seg.y2}
                      stroke={seg.color}
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                  ))}

                  <path
                    d={trackPathString}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="32"
                  />

                  {/* Start/Finish */}
                  {startFinish && (
                    <line
                      x1={startFinish.x1}
                      y1={startFinish.y1}
                      x2={startFinish.x2}
                      y2={startFinish.y2}
                      stroke="#FFFFFF"
                      strokeWidth="4"
                      strokeDasharray="5 3"
                    />
                  )}

                  {/* Turn Apexes */}
                  {showCorners &&
                    transformedCorners.map((corner, idx) => (
                      <g key={idx} transform={`translate(${corner.screenX}, ${corner.screenY})`} className="pointer-events-none">
                        <circle r="14" fill="#090B10" stroke="#64748B" strokeWidth="1.8" />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="Orbitron, monospace"
                        >
                          {corner.number}
                        </text>
                      </g>
                    ))}

                  {/* Live Car Scrub Cursor Dots (Driver ahead is rendered on top; trailing driver is grayscaled & dimmed) */}
                  {(() => {
                    const renderModalD1 = (
                      <g
                        key="modal-d1-dot"
                        transform={d1Coord ? `translate(${d1Coord.x}, ${d1Coord.y})` : undefined}
                        className="pointer-events-none transition-opacity duration-150"
                        filter={!isD1Ahead ? 'url(#car-behind-dim-modal)' : undefined}
                        opacity={!isD1Ahead ? 0.6 : 1}
                      >
                        <circle r={isD1Ahead ? 22 : 14} fill={d1Color} opacity={isD1Ahead ? 0.4 : 0.15} />
                        <circle
                          r={isD1Ahead ? 10.5 : 7.5}
                          fill={d1Color}
                          stroke="#FFFFFF"
                          strokeWidth={isD1Ahead ? 3 : 2}
                        />
                        <rect
                          x="-42"
                          y="-10"
                          width="30"
                          height="16"
                          rx="3"
                          fill="#090B10"
                          fillOpacity="0.9"
                          stroke={d1Color}
                          strokeWidth="1"
                        />
                        <text
                          x="-27"
                          y="-1"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="Orbitron, monospace"
                        >
                          {data.driver1.code}
                        </text>
                      </g>
                    );

                    const renderModalD2 = (
                      <g
                        key="modal-d2-dot"
                        transform={d2Coord ? `translate(${d2Coord.x}, ${d2Coord.y})` : undefined}
                        className="pointer-events-none transition-opacity duration-150"
                        filter={isD1Ahead ? 'url(#car-behind-dim-modal)' : undefined}
                        opacity={isD1Ahead ? 0.6 : 1}
                      >
                        <circle r={!isD1Ahead ? 22 : 14} fill={d2Color} opacity={!isD1Ahead ? 0.4 : 0.15} />
                        <circle
                          r={!isD1Ahead ? 10.5 : 7.5}
                          fill={d2Color}
                          stroke="#FFFFFF"
                          strokeWidth={!isD1Ahead ? 3 : 2}
                        />
                        <rect
                          x="12"
                          y="-10"
                          width="30"
                          height="16"
                          rx="3"
                          fill="#090B10"
                          fillOpacity="0.9"
                          stroke={d2Color}
                          strokeWidth="1"
                        />
                        <text
                          x="27"
                          y="-1"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="Orbitron, monospace"
                        >
                          {data.driver2.code}
                        </text>
                      </g>
                    );

                    // Render chasing driver first, leading driver second (so leading driver is visibly ON TOP)
                    return (
                      <>
                        {isD1Ahead ? (
                          <>
                            {d2Coord && renderModalD2}
                            {d1Coord && renderModalD1}
                          </>
                        ) : (
                          <>
                            {d1Coord && renderModalD1}
                            {d2Coord && renderModalD2}
                          </>
                        )}
                      </>
                    );
                  })()}
                </g>
              </svg>

              {/* CORNER TELEMETRY HUD (Small / Compact: Delta, Throttle, Brake, RPM, Gears) */}
              {hoveredPoint && (
                <div className="absolute top-3 left-3 z-30 pointer-events-none bg-[#090B10]/90 backdrop-blur-md border border-white/15 rounded shadow-2xl p-2 font-mono text-[10px] select-none flex flex-col gap-1.5 min-w-[210px]">
                  {/* Top Bar: Live Distance & Lap Delta */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[9px] font-bold">DIST</span>
                      <span className="text-white font-bold">{Math.round(hoveredPoint.distance)}m</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-[9px] font-bold">Δ</span>
                      <span
                        className={`font-bold ${
                          hoveredPoint.delta <= 0 ? 'text-[#00E676]' : 'text-[#FF1744]'
                        }`}
                      >
                        {hoveredPoint.delta <= 0
                          ? `${hoveredPoint.delta.toFixed(3)}s (${data.driver1.code})`
                          : `+${hoveredPoint.delta.toFixed(3)}s (${data.driver2.code})`}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Channels: Throttle, Brake, RPM, Gears */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                    {/* Throttle */}
                    <div className="flex items-center justify-between bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/5">
                      <span className="text-slate-400 text-[9px] font-bold">THR</span>
                      <div className="flex items-center gap-1 font-bold">
                        <span style={{ color: d1Color }}>{Math.round(hoveredPoint.throttle1)}%</span>
                        <span className="text-slate-600">/</span>
                        <span style={{ color: d2Color }}>{Math.round(hoveredPoint.throttle2)}%</span>
                      </div>
                    </div>

                    {/* Brake */}
                    <div className="flex items-center justify-between bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/5">
                      <span className="text-slate-400 text-[9px] font-bold">BRK</span>
                      <div className="flex items-center gap-1 font-bold">
                        <span className={hoveredPoint.brake1 > 0 ? 'text-red-400' : 'text-slate-500'}>
                          {hoveredPoint.brake1 > 0 ? `${Math.round(hoveredPoint.brake1)}%` : '0%'}
                        </span>
                        <span className="text-slate-600">/</span>
                        <span className={hoveredPoint.brake2 > 0 ? 'text-red-400' : 'text-slate-500'}>
                          {hoveredPoint.brake2 > 0 ? `${Math.round(hoveredPoint.brake2)}%` : '0%'}
                        </span>
                      </div>
                    </div>

                    {/* Gears */}
                    <div className="flex items-center justify-between bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/5">
                      <span className="text-slate-400 text-[9px] font-bold">GEAR</span>
                      <div className="flex items-center gap-1 font-bold">
                        <span style={{ color: d1Color }}>G{hoveredPoint.gear1}</span>
                        <span className="text-slate-600">/</span>
                        <span style={{ color: d2Color }}>G{hoveredPoint.gear2}</span>
                      </div>
                    </div>

                    {/* RPM */}
                    <div className="flex items-center justify-between bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/5">
                      <span className="text-slate-400 text-[9px] font-bold">RPM</span>
                      <div className="flex items-center gap-1 font-mono text-slate-300">
                        <span>{hoveredPoint.rpm1}</span>
                        <span className="text-slate-600">/</span>
                        <span>{hoveredPoint.rpm2}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom: Playback Controls Deck (Play, Pause, Scrub, Speed, Modes) */}
            {playback && (
              <div className="border-t border-white/10 bg-[#090B10] p-1 shrink-0">
                <PlaybackControls
                  isPlaying={playback.isPlaying}
                  playbackSpeed={playback.playbackSpeed}
                  playbackMode={playback.playbackMode}
                  currentDistance={playback.currentDistance}
                  currentElapsedTime={playback.currentElapsedTime}
                  totalLapTime={playback.totalLapTime}
                  trackLength={data.summary.track_length}
                  progressPercent={playback.progressPercent}
                  d1Code={data.driver1.code}
                  d2Code={data.driver2.code}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};
