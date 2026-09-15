import React, { useState, useMemo } from 'react';
import { Zap, Loader2, AlertTriangle, XCircle, Search } from 'lucide-react';
import { AVAILABLE_SESSIONS, VERIFIED_CACHED_SESSIONS, validateSessionInput, getFallbackSchedule } from '../services/api';

export interface SessionFeedbackState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  eventName?: string;
  round?: number;
  country?: string;
  driversCount?: number;
  sessionName?: string;
  urlQueried?: string;
}

interface SessionSelectorProps {
  year: number | string;
  onYearChange: (year: number | string) => void;
  selectedGp: string;
  onGpChange: (gp: string) => void;
  session: string;
  onSessionChange: (session: string) => void;
  onLoadSession: () => void;
  loadingSession: boolean;
  feedback: SessionFeedbackState;
  onSelectPreset: (preset: { year: number; gp: string; session: string }) => void;
  onSubmitted?: () => void;
}

export const SessionSelector: React.FC<SessionSelectorProps> = ({
  year,
  onYearChange,
  selectedGp,
  onGpChange,
  session,
  onSessionChange,
  onLoadSession,
  loadingSession,
  feedback,
  onSelectPreset,
  onSubmitted,
}) => {
  const [gpFilter, setGpFilter] = useState<string>('');
  // Real-time input checking
  const validation = validateSessionInput(year, selectedGp);

  const schedule = useMemo(() => getFallbackSchedule(year), [year]);
  const filteredGps = useMemo(() => {
    if (!gpFilter.trim()) return schedule;
    const q = gpFilter.toLowerCase();
    return schedule.filter(
      (ev) =>
        ev.name.toLowerCase().includes(q) ||
        (ev.location && ev.location.toLowerCase().includes(q)) ||
        (ev.country && ev.country.toLowerCase().includes(q))
    );
  }, [schedule, gpFilter]);

  const handleSubmit = () => {
    onLoadSession();
    if (onSubmitted) {
      onSubmitted();
    }
  };

  return (
    <div className="rounded border border-f1-border bg-[#0E1118] p-3 text-xs font-mono">
      {/* Header with Quick Presets */}
      <div className="pb-2 mb-2.5 border-b border-white/10">
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className="font-orbitron font-bold text-[10px] uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00]"></span>
            SESSION CONFIG
          </span>
          <span className="text-[10px] text-slate-500 font-mono">FASTF1</span>
        </div>

        {/* Cached Presets Pills */}
        <div className="flex flex-wrap gap-1">
          {VERIFIED_CACHED_SESSIONS.slice(0, 4).map((p) => (
            <button
              key={`${p.year}-${p.gp}-${p.session}`}
              type="button"
              onClick={() => onSelectPreset(p)}
              disabled={loadingSession}
              className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
                String(year) === String(p.year) && selectedGp.toLowerCase().includes(p.gp.toLowerCase()) && session === p.session
                  ? 'bg-[#FF6A00] text-black border-[#FF6A00] font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              {p.gp} '{String(p.year).slice(2)}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs Stack */}
      <div className="space-y-2">
        {/* Year Input */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>YEAR:</span>
            <div className="flex items-center gap-1">
              {[2026, 2024].map((quickYear) => (
                <button
                  key={quickYear}
                  type="button"
                  onClick={() => onYearChange(quickYear)}
                  className={`px-1 py-0.2 rounded text-[9px] ${
                    String(year) === String(quickYear)
                      ? 'bg-[#FF6A00] text-black font-bold'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {quickYear}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            disabled={loadingSession}
            className="w-full bg-[#141722] text-white border border-f1-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#FF6A00]"
          />
        </div>

        {/* Grand Prix Input with Searchable Select */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>GRAND PRIX:</span>
            <span className="text-[9px] text-slate-500">TYPE TO FILTER</span>
          </div>
          <div className="relative mb-1.5">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              value={selectedGp}
              onChange={(e) => {
                onGpChange(e.target.value);
                setGpFilter(e.target.value);
              }}
              placeholder="Type GP (e.g. Australia, Spanish, Monaco)"
              disabled={loadingSession}
              className="w-full bg-[#141722] text-white border border-f1-border rounded pl-7 pr-2 py-1 text-xs font-mono focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          {/* Quick Select Scroll List */}
          <div className="max-h-24 overflow-y-auto border border-white/5 bg-[#0B0D13] rounded p-1 space-y-0.5">
            {filteredGps.slice(0, 12).map((ev) => {
              const cleanName = ev.name.replace(/\s+Grand\s+Prix/i, '');
              const isSelected = selectedGp.toLowerCase() === cleanName.toLowerCase();
              return (
                <button
                  key={ev.name}
                  type="button"
                  onClick={() => {
                    onGpChange(cleanName);
                    setGpFilter('');
                  }}
                  className={`w-full text-left px-2 py-0.5 rounded text-[10px] flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#FF6A00]/20 text-[#FF6A00] font-bold'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <span>{cleanName}</span>
                  <span className="text-slate-500 text-[9px]">{ev.country}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Session Dropdown */}
        <div>
          <span className="text-[10px] text-slate-400 block mb-1">SESSION:</span>
          <select
            value={session}
            onChange={(e) => onSessionChange(e.target.value)}
            disabled={loadingSession}
            className="w-full bg-[#141722] text-white border border-f1-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#FF6A00] cursor-pointer"
          >
            {AVAILABLE_SESSIONS.map((s) => (
              <option key={s.code} value={s.code} className="bg-[#141722]">
                {s.code} ({s.label})
              </option>
            ))}
          </select>
        </div>

        {/* Load Session Button */}
        <button
          onClick={handleSubmit}
          disabled={loadingSession || !validation.isValid}
          className={`w-full py-1.5 px-3 rounded font-orbitron font-bold text-[11px] uppercase tracking-wider transition-colors border flex items-center justify-center gap-1.5 ${
            loadingSession
              ? 'bg-[#FF6A00]/20 text-[#FF6A00] border-[#FF6A00]/40'
              : !validation.isValid
              ? 'bg-white/5 text-slate-500 border-white/10'
              : 'bg-[#FF6A00] hover:bg-[#FF7A1A] text-black border-[#FF6A00] cursor-pointer'
          }`}
        >
          {loadingSession ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>LOADING...</span>
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 fill-current" />
              <span>LOAD SESSION</span>
            </>
          )}
        </button>
      </div>

      {/* Compact Status Feedback */}
      {feedback.status === 'success' && (
        <div className="mt-2 px-2 py-1 rounded bg-[#00E676]/10 border border-[#00E676]/30 text-[11px] font-mono text-[#00E676] flex items-center justify-between">
          <span>LOADED: {feedback.eventName || selectedGp}</span>
          <span className="text-[9px] text-slate-400">{feedback.driversCount || 20} DRVS</span>
        </div>
      )}

      {feedback.status === 'error' && (
        <div className="mt-2 px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-[10px] font-mono text-red-300">
          {feedback.message || 'Failed to load session.'}
        </div>
      )}

      {/* Real-time Input Validation Warning */}
      {validation.warning && (
        <div className="mt-3 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs font-mono text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{validation.warning}</span>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectPreset(VERIFIED_CACHED_SESSIONS[0])}
                className="underline hover:text-white font-bold"
              >
                &gt; Load {VERIFIED_CACHED_SESSIONS[0].year} {VERIFIED_CACHED_SESSIONS[0].gp} ({VERIFIED_CACHED_SESSIONS[0].session})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Input Validation Error */}
      {validation.error && (
        <div className="mt-3 p-2.5 rounded bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs font-mono text-red-300">
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{validation.error}</span>
        </div>
      )}

      {feedback.status === 'error' && (
        <div className="mt-4 p-3 rounded bg-red-500/10 border border-red-500/40 text-xs font-mono">
          <div className="flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-bold text-red-400 uppercase">
                  SESSION LOAD FAILED
                </span>
                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">
                  BACKEND NOTICE
                </span>
              </div>
              <p className="text-slate-300 mt-1">
                {feedback.message || 'FastF1 could not load the requested session. Check that the year and Grand Prix match official F1 calendar records.'}
              </p>

              <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center gap-3">
                <span className="text-slate-400 text-[11px]">Quick Resolution:</span>
                <button
                  type="button"
                  onClick={() => onSelectPreset(VERIFIED_CACHED_SESSIONS[0])}
                  className="px-2.5 py-1 rounded bg-[#FF6A00]/20 hover:bg-[#FF6A00]/30 text-[#FF6A00] border border-[#FF6A00]/40 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Load {VERIFIED_CACHED_SESSIONS[0].label}
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPreset(VERIFIED_CACHED_SESSIONS[1])}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[11px] transition-colors cursor-pointer"
                >
                  Load {VERIFIED_CACHED_SESSIONS[1].label}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
