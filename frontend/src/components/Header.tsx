import React from 'react';
import { Code2 } from 'lucide-react';

interface HeaderProps {
  onOpenSetup: () => void;
  onOpenCompare: () => void;
  onOpenJsonInspector: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSetup,
  onOpenCompare,
  onOpenJsonInspector,
}) => {
  return (
    <header className="border-b border-f1-border bg-[#0B0D13] sticky top-0 z-40 h-8 flex items-center px-3">
      <div className="w-full flex items-center justify-between gap-2">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2">
          <span className="font-orbitron font-black text-sm text-[#FF6A00] tracking-wider flex items-center gap-1">
            ▲ APEX<span className="text-white">DATA</span>
          </span>
          <span className="text-slate-600 text-[11px]">|</span>
          <span className="text-[10px] text-slate-400 font-mono">
            F1 TELEMETRY SYSTEM
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <button
            onClick={onOpenSetup}
            title="Configure Session (Year, GP, Session)"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00]"></span>
            <span>SETUP</span>
          </button>

          <button
            onClick={onOpenCompare}
            title="Configure Driver Comparison"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]"></span>
            <span>COMPARE</span>
          </button>

          <button
            onClick={onOpenJsonInspector}
            title="Inspect raw backend REST response JSON"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Code2 className="w-3 h-3 text-[#FF6A00]" />
            <span>JSON</span>
          </button>
        </div>
      </div>
    </header>
  );
};
