import React from 'react';
import { Settings, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentTeam, setTeam, availableTeams, theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0E1118] border border-white/20 rounded-lg shadow-21l w-full max-w-mg flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-[#121520] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" style={{ color: theme.primaryColor }} />
            <span className="font-orbitron font-bold text-xs uppercase tracking-wider text-white">
              APEXDATA SETTINGS // TEAM CONSTRUCTOR THEME
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded hover:bg-white/10 cursor-pointer"
          >
            ESC ✕
          </button>
        </div>


        <div className="p-4 space-y-4 font-mono text-xs max-h-[fit-content]">
          <div>
            <div className="text-slate-300 font-bold mb-1">SELECT ACTIVE FORMULA 1 TEAM THEME</div>
            <div className="text-slate-500 text-[11px] mb-3">
              Adapts accents, sector highlights, and landing hero visuals to match constructor liveries.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
              {availableTeams.map((t) => {
                const isSelected = t.id === currentTeam;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTeam(t.id)}
                    className={`flex items-center justify-between p-2.5 rounded border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'border-white/40 bg-white/10 shadow-lg'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow"
                        style={{ backgroundColor: t.primaryColor }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-200 truncate">{t.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{t.tagline}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 shrink-0" style={{ color: t.primaryColor }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>


        <div className="px-4 py-2.5 border-t border-white/10 bg-[#121520] flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">
            ACTIVE: <strong style={{ color: theme.primaryColor }}>{theme.name.toUpperCase()}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-xs font-bold font-mono transition-opacity cursor-pointer"
            style={{ backgroundColor: theme.primaryColor, color: '#000000' }}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};
