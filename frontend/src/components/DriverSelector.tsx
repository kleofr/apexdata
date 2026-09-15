import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Gauge, Loader2, Search } from 'lucide-react';
import { Driver } from '../types/telemetry';

interface DriverSelectorProps {
  drivers: Driver[];
  driver1: string;
  driver2: string;
  onDriver1Change: (code: string) => void;
  onDriver2Change: (code: string) => void;
  onSwapDrivers: () => void;
  onCompare: () => void;
  loadingCompare: boolean;
  disabled: boolean;
  driver1Color?: string;
  driver2Color?: string;
  onSubmitted?: () => void;
  currentSessionLabel?: string;
}

export const DriverSelector: React.FC<DriverSelectorProps> = ({
  drivers,
  driver1,
  driver2,
  onDriver1Change,
  onDriver2Change,
  onSwapDrivers,
  onCompare,
  loadingCompare,
  disabled,
  driver1Color = '#FF6A00',
  driver2Color = '#00F0FF',
  onSubmitted,
  currentSessionLabel,
}) => {
  const [search1, setSearch1] = useState<string>('');
  const [search2, setSearch2] = useState<string>('');
  const [isD1Open, setIsD1Open] = useState<boolean>(false);
  const [isD2Open, setIsD2Open] = useState<boolean>(false);

  const d1Data = drivers.find((d) => d.code === driver1 || d.number === driver1);
  const d2Data = drivers.find((d) => d.code === driver2 || d.number === driver2);

  const filteredD1 = useMemo(() => {
    if (!search1.trim()) return drivers;
    const q = search1.toLowerCase();
    return drivers.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        (d.last_name && d.last_name.toLowerCase().includes(q)) ||
        (d.first_name && d.first_name.toLowerCase().includes(q)) ||
        (d.team && d.team.toLowerCase().includes(q)) ||
        d.number.includes(q)
    );
  }, [drivers, search1]);

  const filteredD2 = useMemo(() => {
    if (!search2.trim()) return drivers;
    const q = search2.toLowerCase();
    return drivers.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        (d.last_name && d.last_name.toLowerCase().includes(q)) ||
        (d.first_name && d.first_name.toLowerCase().includes(q)) ||
        (d.team && d.team.toLowerCase().includes(q)) ||
        d.number.includes(q)
    );
  }, [drivers, search2]);

  const handleCompareSubmit = () => {
    onCompare();
    if (onSubmitted) {
      onSubmitted();
    }
  };

  return (
    <div className="rounded border border-f1-border bg-[#0E1118] p-3 text-xs font-mono select-none overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <span className="font-orbitron font-bold text-[10px] uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]"></span>
          DRIVERS COMPARISON
        </span>
        <button
          onClick={onSwapDrivers}
          disabled={disabled || loadingCompare}
          title="Swap Drivers"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white text-[10px] transition-colors cursor-pointer"
        >
          <ArrowLeftRight className="w-2.5 h-2.5" /> SWAP
        </button>
      </div>

      {/* Session Context Banner */}
      {currentSessionLabel && (
        <div className="mb-3 px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-slate-300 flex items-center justify-between">
          <span className="text-slate-500">ACTIVE SESSION:</span>
          <span className="font-bold text-[#FF6A00]">{currentSessionLabel}</span>
        </div>
      )}

      <div className="space-y-3 overflow-visible">
        {/* DRIVER 1: Unified Type-and-Select */}
        <div className="relative z-30">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: driver1Color }}></span>
              DRIVER 1 (REFERENCE)
            </span>
            {d1Data && <span className="text-slate-400 font-mono">#{d1Data.number} {d1Data.team}</span>}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search1 !== '' ? search1 : d1Data ? `#${d1Data.number} ${d1Data.last_name || d1Data.code} (${d1Data.code}) - ${d1Data.team}` : driver1}
              onChange={(e) => {
                setSearch1(e.target.value);
                setIsD1Open(true);
              }}
              onFocus={() => {
                setSearch1('');
                setIsD1Open(true);
              }}
              onBlur={() => {
                // Delay so click on option registers
                setTimeout(() => setIsD1Open(false), 200);
              }}
              placeholder="Type to search Driver 1..."
              disabled={disabled || loadingCompare}
              className="w-full bg-[#141722] text-white border border-f1-border rounded pl-8 pr-2 py-1.5 text-xs font-mono focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          {/* Search Dropdown list */}
          {isD1Open && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-40 overflow-y-auto bg-[#10131C] border border-white/20 rounded shadow-2xl z-50 p-1 space-y-0.5">
              {filteredD1.length === 0 ? (
                <div className="px-2 py-1.5 text-slate-500 text-[10px]">No drivers found.</div>
              ) : (
                filteredD1.map((d) => (
                  <button
                    key={`d1-${d.code || d.number}`}
                    type="button"
                    onMouseDown={() => {
                      onDriver1Change(d.code || d.number);
                      setSearch1('');
                      setIsD1Open(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between hover:bg-white/10 transition-colors ${
                      (d.code === driver1 || d.number === driver1) ? 'bg-[#FF6A00]/20 text-[#FF6A00] font-bold' : 'text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold">#{d.number} {d.last_name || d.code}</span>
                      <span className="text-slate-500">({d.code})</span>
                    </span>
                    <span className="text-[10px] text-slate-400">{d.team}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* DRIVER 2: Unified Type-and-Select */}
        <div className="relative z-20">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: driver2Color }}></span>
              DRIVER 2 (COMPARISON)
            </span>
            {d2Data && <span className="text-slate-400 font-mono">#{d2Data.number} {d2Data.team}</span>}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search2 !== '' ? search2 : d2Data ? `#${d2Data.number} ${d2Data.last_name || d2Data.code} (${d2Data.code}) - ${d2Data.team}` : driver2}
              onChange={(e) => {
                setSearch2(e.target.value);
                setIsD2Open(true);
              }}
              onFocus={() => {
                setSearch2('');
                setIsD2Open(true);
              }}
              onBlur={() => {
                setTimeout(() => setIsD2Open(false), 200);
              }}
              placeholder="Type to search Driver 2..."
              disabled={disabled || loadingCompare}
              className="w-full bg-[#141722] text-white border border-f1-border rounded pl-8 pr-2 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00F0FF]"
            />
          </div>

          {/* Search Dropdown list */}
          {isD2Open && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-40 overflow-y-auto bg-[#10131C] border border-white/20 rounded shadow-2xl z-50 p-1 space-y-0.5">
              {filteredD2.length === 0 ? (
                <div className="px-2 py-1.5 text-slate-500 text-[10px]">No drivers found.</div>
              ) : (
                filteredD2.map((d) => (
                  <button
                    key={`d2-${d.code || d.number}`}
                    type="button"
                    onMouseDown={() => {
                      onDriver2Change(d.code || d.number);
                      setSearch2('');
                      setIsD2Open(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between hover:bg-white/10 transition-colors ${
                      (d.code === driver2 || d.number === driver2) ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-bold' : 'text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold">#{d.number} {d.last_name || d.code}</span>
                      <span className="text-slate-500">({d.code})</span>
                    </span>
                    <span className="text-[10px] text-slate-400">{d.team}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Compare Action Button */}
        <button
          onClick={handleCompareSubmit}
          disabled={disabled || loadingCompare || !driver1 || !driver2}
          className={`w-full py-2 px-3 rounded font-orbitron font-bold text-[11px] uppercase tracking-wider transition-colors border flex items-center justify-center gap-1.5 ${
            loadingCompare
              ? 'bg-[#FF6A00]/20 text-[#FF6A00] border-[#FF6A00]/50'
              : 'bg-[#FF6A00] hover:bg-[#FF7A1A] text-black border-[#FF6A00] cursor-pointer'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {loadingCompare ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6A00]" />
              <span>COMPARING...</span>
            </>
          ) : (
            <>
              <Gauge className="w-3.5 h-3.5 text-black fill-current" />
              <span>COMPARE LAPS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
