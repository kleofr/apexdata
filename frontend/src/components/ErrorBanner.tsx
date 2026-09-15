import React from 'react';
import { AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';

interface ErrorBannerProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onRetry,
}) => {
  // Identify common FastF1 error types
  const isCacheMiss = error.toLowerCase().includes('cache') || error.toLowerCase().includes('download');
  const isNoLap = error.toLowerCase().includes('lap') || error.toLowerCase().includes('driver');
  const isNetwork = error.toLowerCase().includes('connect') || error.toLowerCase().includes('backend') || error.toLowerCase().includes('500');

  let title = 'TELEMETRY PIPELINE ERROR';
  let guidance = 'Verify backend FastF1 session parameters or selected driver codes.';

  if (isCacheMiss) {
    title = 'FASTF1 CACHE MISS // SESSION NOT FOUND';
    guidance = 'The requested session data has not been cached or is unavailable from the F1 timing service for this round.';
  } else if (isNoLap) {
    title = 'NO TIMED LAP FOUND FOR DRIVER';
    guidance = 'One or both selected drivers did not set a valid timed lap in this session (e.g., DNS, DNF, or out-lap only). Try comparing other drivers.';
  } else if (isNetwork) {
    title = 'BACKEND CONNECTION REFUSED / UNREACHABLE';
    guidance = 'Flask backend at http://127.0.0.1:5000 is not responding. Ensure python backend/app.py is running.';
  }

  return (
    <div className="hud-panel p-4 sm:p-5 rounded-md border border-red-500/40 bg-[#171216] shadow-lg my-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-orbitron font-bold text-sm text-red-400 tracking-wider uppercase">
              {title}
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300">
              FASTF1_NOTICE
            </span>
          </div>

          <p className="font-mono text-xs text-slate-300 mt-1">
            {error}
          </p>

          <p className="text-xs font-rajdhani text-slate-400 mt-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>{guidance}</span>
          </p>

          {onRetry && (
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5">
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-colors border border-white/10 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RETRY ACQUISITION</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
