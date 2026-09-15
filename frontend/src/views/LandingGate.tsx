import React, { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingGateProps {
  onEnterHub: (year: number, gp: string) => void;
  isLoading: boolean;
}

const PRESET_GPS = [
  { year: 2024, gp: 'Monaco', label: '2024 Monaco GP', badge: 'Street Circuit' },
  { year: 2024, gp: 'Spain', label: '2024 Spanish GP', badge: 'Barcelona-Catalunya' },
  { year: 2026, gp: 'Spain', label: '2026 Spanish GP', badge: 'Madrid IFEMA' },
  { year: 2024, gp: 'Silverstone', label: '2024 British GP', badge: 'High Downforce' },
  { year: 2024, gp: 'Spa', label: '2024 Belgian GP', badge: 'Eau Rouge' },
  { year: 2024, gp: 'Azerbaijan', label: '2024 Baku GP', badge: '2.2km Straight' },
];

export const LandingGate: React.FC<LandingGateProps> = ({ onEnterHub, isLoading }) => {
  const { theme } = useTheme();
  const [year, setYear] = useState<number>(2024);
  const [gp, setGp] = useState<string>('Monaco');
  const [customGpInput, setCustomGpInput] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalGp = customGpInput.trim() || gp;
    if (finalGp) {
      onEnterHub(year, finalGp);
    }
  };

  const handleSelectPreset = (pYear: number, pGp: string) => {
    setYear(pYear);
    setGp(pGp);
    setCustomGpInput('');
    onEnterHub(pYear, pGp);
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden bg-[#07080B] flex select-none font-mono">
      {/* LEFT PANE: Dynamic Team-Adaptive Aerodynamic Hero */}
      <div className="hidden md:flex md:w-1/2 h-full relative flex-col justify-between p-8 border-r border-white/10 overflow-hidden bg-gradient-to-br from-[#090B10] via-[#0E121B] to-[#07080B]">
        {/* Background glow and carbon styling */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: theme.primaryColor }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: theme.secondaryColor }}
        />

        {/* Top Header info */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: theme.primaryColor, boxShadow: `0 0 10px ${theme.primaryColor}` }}
            />
            <span className="font-orbitron font-bold text-xs uppercase tracking-widest text-white">
              {theme.name.toUpperCase()} // RACING INTELLIGENCE
            </span>
          </div>
          <h1 className="font-orbitron font-black text-4xl lg:text-5xl text-white tracking-wider leading-tight">
            APEX<span style={{ color: theme.primaryColor }}>DATA</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-md font-mono">
            {theme.tagline}
          </p>
        </div>

        {/* Center: Dynamic F1 Aerodynamic Livery & Technical Telemetry Hero */}
        <div className="relative z-10 my-auto py-6">
          <div className="p-6 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md relative overflow-hidden shadow-2xl">
            {/* Speed & Downforce Telemetry Readout Graphic */}
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">AERODYNAMIC APEX VELOCITY</div>
                <div className="text-3xl font-black font-orbitron text-white tracking-tight flex items-baseline gap-1">
                  348.2 <span className="text-xs font-mono text-slate-400 font-normal">KM/H</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 font-bold uppercase">LATERAL G-FORCE</div>
                <div className="text-2xl font-bold font-orbitron text-cyan-300">
                  4.82 G
                </div>
              </div>
            </div>

            {/* Stylized Formula 1 Car Wireframe & telemetry tracks */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>FRONT WING CHORD DEVIATION:</span>
                <span className="font-bold text-white font-mono">+1.2 deg</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: '84%', backgroundColor: theme.primaryColor }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>DIFFUSER UNDERFLOOR SUCTION:</span>
                <span className="font-bold font-mono" style={{ color: theme.secondaryColor }}>
                  OPTIMAL SEAL
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: '92%', backgroundColor: theme.secondaryColor }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: theme.primaryColor }} />
                FASTF1 TELEMETRY READY
              </span>
              <span>2024-2026 OFFICIAL REPOSITORIES</span>
            </div>
          </div>
        </div>

        {/* Bottom Technical Strip */}
        <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-500 border-t border-white/10 pt-4">
          <span>HIGH-PRECISION PIT WALL GATE</span>
          <span>LATENCY: &lt; 25MS</span>
        </div>
      </div>

      {/* RIGHT PANE: Grand Prix & Championship Year Entry Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-between p-6 sm:p-12 overflow-y-auto bg-[#07080B]">
        {/* Top Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: theme.primaryColor }}
            />
            <span className="font-orbitron font-bold text-xs uppercase tracking-widest text-slate-400">
              MISSION CONTROL // AUTH GATE
            </span>
          </div>
          <h2 className="font-orbitron font-bold text-2xl sm:text-3xl text-white">
            SELECT GRAND PRIX
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Enter championship year and Grand Prix venue to load full race classification, circuit specs, weather, and FIA documents.
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="my-auto py-6 space-y-5">
          {/* Year Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>CHAMPIONSHIP YEAR</span>
              <span className="text-[10px] text-slate-500 font-normal">FastF1 Official: 1950 - 2026</span>
            </label>
            <div className="flex gap-2">
              {[2024, 2023, 2022].map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`px-3 py-1.5 rounded text-xs border font-mono transition-all cursor-pointer ${
                    year === y
                      ? 'border-white/50 text-white font-bold'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                  }`}
                  style={year === y ? { backgroundColor: `${theme.primaryColor}22`, color: theme.primaryColor } : {}}
                >
                  {y}
                </button>
              ))}
              <input
                type="number"
                min={1950}
                max={2026}
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || 2024)}
                className="flex-1 px-3 py-1.5 rounded bg-black/60 border border-white/10 text-white text-xs font-mono focus:border-white/40 focus:outline-none"
                placeholder="Custom Year"
              />
            </div>
          </div>

          {/* Grand Prix Select / Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>GRAND PRIX VENUE</span>
              <span className="text-[10px] text-slate-500 font-normal">e.g. Monaco, Australia, Silverstone, Spa</span>
            </label>
            <input
              type="text"
              value={customGpInput || gp}
              onChange={(e) => {
                setCustomGpInput(e.target.value);
                setGp(e.target.value);
              }}
              placeholder="Enter Grand Prix name (e.g. Monaco)"
              className="w-full px-3 py-2.5 rounded bg-black/60 border border-white/15 text-white text-xs font-mono focus:border-white/50 focus:outline-none"
            />
          </div>

          {/* Quick Presets Grid */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              POPULAR CALENDAR PRESETS:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {PRESET_GPS.map((p) => (
                <button
                  key={`${p.year}-${p.gp}`}
                  type="button"
                  onClick={() => handleSelectPreset(p.year, p.gp)}
                  className={`p-2 rounded border text-left transition-all cursor-pointer ${
                    year === p.year && gp.toLowerCase() === p.gp.toLowerCase()
                      ? 'border-white/40 bg-white/10 text-white'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/5 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-white text-[11px] truncate">{p.label}</div>
                  <div className="text-[9px] text-slate-500 truncate">{p.badge}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded text-xs font-bold font-orbitron tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-[0.99] cursor-pointer shadow-xl"
            style={{
              backgroundColor: theme.primaryColor,
              color: '#000000',
              boxShadow: `0 0 24px ${theme.glowColor}`
            }}
          >
            <span>ENTER RACE HUB</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info */}
        <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-white/10 pt-3">
          <span>APEXDATA ENGINE V2.0</span>
          <span>STRICT ZERO-SCROLL PIT-WALL CONSOLE</span>
        </div>
      </div>
    </div>
  );
};
