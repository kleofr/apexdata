import React from 'react';
import { Settings } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TopNavigationProps {
  currentView: 'landing' | 'dashboard' | 'telemetry' | 'qualifying';
  onNavigate: (view: 'landing' | 'dashboard' | 'telemetry' | 'qualifying') => void;
  onOpenSettings: () => void;
  year?: number | string;
  gp?: string;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  year,
  gp,
}) => {
  const { theme } = useTheme();

  return (
    <header className="border-b border-white/10 bg-[#0B0D13] sticky top-0 z-40 h-8 flex items-center px-3 shrink-0">
      <div className="w-full flex items-center justify-between gap-2">
        {/* Brand & Breadcrumbs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('landing')}
            className="font-orbitron font-black text-xs tracking-wider flex items-center gap-1 hover:opacity-90 transition-opacity cursor-pointer"
            style={{ color: theme.primaryColor }}
          >
            <span>▲ APEX</span>
            <span className="text-white">DATA</span>
          </button>
          
          <span className="text-slate-600 text-[11px]">/</span>
          
          {gp && year ? (
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
              <span className="font-bold text-white">{year} {gp.toUpperCase()} GP</span>
              <span className="text-slate-600">|</span>
              <span className="text-[10px] text-slate-400 uppercase">
                {currentView === 'landing'
                  ? 'GATE'
                  : currentView === 'dashboard'
                  ? 'WEEKEND INTELLIGENCE'
                  : currentView === 'qualifying'
                  ? 'QUALIFYING DELTA BENCHMARK'
                  : 'TELEMETRY COMPARISON'}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">F1 TELEMETRY SYSTEM</span>
          )}
        </div>


        {/* Controls */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            title="Telemetry & Constructor Theme Settings"
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: theme.primaryColor }}
            />
            <span className="font-bold text-[10px] tracking-wider uppercase">SETTINGS</span>
            <Settings className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
