import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { FiaDocument } from '../../types/dashboard';
import { useTheme } from '../../context/ThemeContext';

interface FiaDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: FiaDocument[];
  eventTitle?: string;
}

export const FiaDocumentsModal: React.FC<FiaDocumentsModalProps> = ({
  isOpen,
  onClose,
  documents,
  eventTitle,
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0E1118] border border-white/20 rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-4 py-3 border-b border-white/10 bg-[#121520] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: theme.primaryColor }} />
            <span className="font-orbitron font-bold text-xs uppercase tracking-wider text-white">
              FIA TECHNICAL DOCUMENTS & CAR CHANGES // {eventTitle || 'GRAND PRIX'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded hover:bg-white/10 cursor-pointer"
          >
            ESC ✕
          </button>
        </div>

        {/* Modal Document Stream */}
        <div className="p-4 space-y-4 font-mono text-xs overflow-y-auto flex-1">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-3 rounded bg-white/[0.02] border border-white/10 space-y-2"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="px-1.5 py-0.5 rounded font-bold text-[10px]"
                    style={{ backgroundColor: `${theme.primaryColor}25`, color: theme.primaryColor }}
                  >
                    {doc.id}
                  </span>
                  <span className="font-bold text-white text-xs">{doc.title}</span>
                </div>
                <span className="text-[10px] text-slate-400">{doc.time_issued}</span>
              </div>

              <div className="text-[11px] text-slate-300">{doc.summary}</div>

              {/* Updates List */}
              {doc.updates && doc.updates.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    SUBMISSIONS & HARDWARE CHANGES:
                  </div>
                  {doc.updates.map((u, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-black/40 border border-white/5 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px]">{u.team}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/5 text-slate-400 border border-white/5">
                          {u.type}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-amber-300">{u.component}</div>
                      <div className="text-[10px] text-slate-400">{u.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/10 bg-[#121520] flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-400 font-mono">
            FEDERATION INTERNATIONALE DE L'AUTOMOBILE // OFFICIAL SCRUTINEERING
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-xs font-bold font-mono transition-opacity cursor-pointer"
            style={{ backgroundColor: theme.primaryColor, color: '#000000' }}
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
