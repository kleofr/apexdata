import React, { useMemo, useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { QualifyingTelemetrySample, CornerAnalysisItem } from '../../types/qualifying';

interface QualifyingCircuitMapProps {
  telemetry: QualifyingTelemetrySample[];
  corners: CornerAnalysisItem[];
  poleDriver: { code: string; team_color: string };
  refDriver: { code: string; team_color: string };
  selectedCorner: CornerAnalysisItem | null;
  onSelectCorner: (c: CornerAnalysisItem) => void;
  hoveredDistance?: number | null;
}

export const QualifyingCircuitMap: React.FC<QualifyingCircuitMapProps> = ({
  telemetry,
  corners,
  poleDriver,
  refDriver,
  selectedCorner,
  onSelectCorner,
  hoveredDistance,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);


  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoomLevel((prev) => Math.min(Math.max(0.7, prev * zoomFactor), 4.5));
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

  const {
    segments,
    trackPath,
    screenCorners,
    targetW,
    targetH,
    hoveredMarkerCoord,
    selectedCornerCoord,
  } = useMemo(() => {
    const defaultReturn = {
      segments: [],
      trackPath: '',
      screenCorners: [],
      targetW: 800,
      targetH: 600,
      hoveredMarkerCoord: null,
      selectedCornerCoord: null,
    };

    if (!telemetry || telemetry.length < 5) {
      return defaultReturn;
    }

    const hasCoords = telemetry.some((p) => p.x !== undefined && p.x !== 0 && p.y !== undefined && p.y !== 0);
    if (!hasCoords) {
      return defaultReturn;
    }

    const tW = 850;
    const tH = 550;
    const pad = 12;

    const xs = telemetry.map((p) => p.x || 0);
    const ys = telemetry.map((p) => p.y || 0);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const rawSpanX = maxX - minX || 1;
    const rawSpanY = maxY - minY || 1;

    const availW = tW - pad * 2;
    const availH = tH - pad * 2;
    const scale = Math.min(availW / rawSpanX, availH / rawSpanY);

    const offsetX = pad + (availW - rawSpanX * scale) / 2;
    const offsetY = pad + (availH - rawSpanY * scale) / 2;

    const toScreen = (x: number, y: number) => ({
      x: offsetX + (x - minX) * scale,
      y: tH - (offsetY + (y - minY) * scale),
    });

    const screenPts = telemetry.map((p) => {
      const s = toScreen(p.x || 0, p.y || 0);
      return {
        ...p,
        sx: s.x,
        sy: s.y,
      };
    });

    // Build segments colored by who is faster: speed_driver vs speed_pole
    const segList: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      point: any;
    }> = [];

    const poleClr = poleDriver.team_color || '#FF6A00';
    const refClr = refDriver.team_color || '#00F0FF';

    for (let i = 0; i < screenPts.length - 1; i++) {
      const p1 = screenPts[i];
      const p2 = screenPts[i + 1];
      const spdDiff = p1.speed_driver - p1.speed_pole;
      const color = Math.abs(spdDiff) < 1.5 ? '#64748B' : spdDiff > 0 ? refClr : poleClr;

      segList.push({
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
      segList.push({
        x1: last.sx,
        y1: last.sy,
        x2: first.sx,
        y2: first.sy,
        color: '#64748B',
        point: last,
      });
    }

    const pathParts = [`M ${screenPts[0].sx.toFixed(1)} ${screenPts[0].sy.toFixed(1)}`];
    for (let i = 1; i < screenPts.length; i++) {
      pathParts.push(`L ${screenPts[i].sx.toFixed(1)} ${screenPts[i].sy.toFixed(1)}`);
    }
    pathParts.push('Z');
    const closedPath = pathParts.join(' ');

    // Match corners to coordinates
    const cornerScreenPts = corners.map((c) => {
      const nearest = screenPts.reduce((prev, curr) =>
        Math.abs(curr.distance - c.distance) < Math.abs(prev.distance - c.distance) ? curr : prev
      );
      return {
        ...c,
        sx: nearest.sx,
        sy: nearest.sy,
      };
    });

    let hCoord = null;
    if (hoveredDistance !== undefined && hoveredDistance !== null) {
      const nearest = screenPts.reduce((prev, curr) =>
        Math.abs(curr.distance - hoveredDistance) < Math.abs(prev.distance - hoveredDistance) ? curr : prev
      );
      hCoord = { x: nearest.sx, y: nearest.sy };
    }

    let sCoord = null;
    if (selectedCorner) {
      const found = cornerScreenPts.find((c) => c.corner_number === selectedCorner.corner_number);
      if (found) {
        sCoord = { x: found.sx, y: found.sy };
      }
    }

    return {
      segments: segList,
      trackPath: closedPath,
      screenCorners: cornerScreenPts,
      targetW: tW,
      targetH: tH,
      hoveredMarkerCoord: hCoord,
      selectedCornerCoord: sCoord,
    };
  }, [telemetry, corners, poleDriver, refDriver, hoveredDistance, selectedCorner]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full flex flex-col overflow-hidden select-none font-mono"
    >
      {/* Zoom Controls */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-[#090C12]/80 backdrop-blur-sm border border-white/10 rounded px-1 py-0.5">
        <button
          onClick={() => setZoomLevel((z) => Math.min(4.5, z * 1.25))}
          className="px-1.5 py-0.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded cursor-pointer transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <span className="text-[9px] text-slate-400 font-mono w-7 text-center">{Math.round(zoomLevel * 100)}%</span>
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.7, z * 0.8))}
          className="px-1.5 py-0.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded cursor-pointer transition-colors"
          title="Zoom Out"
        >
          -
        </button>
        {zoomLevel !== 1 && (
          <button
            onClick={handleResetZoom}
            className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-white/10 rounded cursor-pointer transition-colors ml-0.5"
            title="Reset Zoom"
          >
            <RefreshCw className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* SVG Circuit Canvas */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center overflow-hidden">
        {segments.length === 0 ? (
          <div className="text-slate-500 text-xs">Generating Circuit Trajectory...</div>
        ) : (
          <svg
            viewBox={`0 0 ${targetW} ${targetH}`}
            className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {/* Outer roadbed glow */}
            <path
              d={trackPath}
              fill="none"
              stroke="#000000"
              strokeWidth="20"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Dark asphalt roadbed */}
            <path
              d={trackPath}
              fill="none"
              stroke="#141822"
              strokeWidth="12"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Micro-sector Delta Segments */}
            {segments.map((seg, idx) => (
              <line
                key={idx}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke={seg.color}
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            ))}

            {/* Corner Markers */}
            {screenCorners.map((c) => {
              const isSelected = selectedCorner?.corner_number === c.corner_number;
              return (
                <g
                  key={c.corner_number}
                  onClick={() => onSelectCorner(c)}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={c.sx}
                    cy={c.sy}
                    r={isSelected ? 10 : 7}
                    fill={isSelected ? '#00F0FF' : '#0B0D13'}
                    stroke={isSelected ? '#FFFFFF' : '#475569'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="transition-all"
                  />
                  <text
                    x={c.sx}
                    y={c.sy + 3.5}
                    textAnchor="middle"
                    fill={isSelected ? '#000000' : '#E2E8F0'}
                    fontSize={isSelected ? '9' : '7.5'}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {c.corner_number}
                  </text>
                </g>
              );
            })}

            {/* Selected Corner Pulsing Ring */}
            {selectedCornerCoord && (
              <circle
                cx={selectedCornerCoord.x}
                cy={selectedCornerCoord.y}
                r="16"
                fill="none"
                stroke="#00F0FF"
                strokeWidth="2"
                strokeDasharray="4 2"
                className="animate-spin"
                style={{ transformOrigin: `${selectedCornerCoord.x}px ${selectedCornerCoord.y}px` }}
              />
            )}

            {/* Hovered Distance Crosshair */}
            {hoveredMarkerCoord && (
              <circle
                cx={hoveredMarkerCoord.x}
                cy={hoveredMarkerCoord.y}
                r="6"
                fill="#FF6A00"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            )}
          </svg>
        )}
      </div>
    </div>
  );
};

