import React from 'react';
import { Trophy } from 'lucide-react';
import { GridResultDriver } from '../../types/dashboard';
import { useTheme } from '../../context/ThemeContext';

interface GridResultsTableProps {
  results: GridResultDriver[];
}

export const GridResultsTable: React.FC<GridResultsTableProps> = ({
  results,
}) => {
  const { theme } = useTheme();

  return (
    <div className="h-full flex flex-col bg-transparent overflow-hidden select-none font-mono text-xs">
      {/* Table Header Strip (Card-less) */}
      <div className="px-1.5 py-1 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" style={{ color: theme.primaryColor }} />
          <span className="font-orbitron font-bold text-[10px] text-white tracking-wider uppercase">
            RACE CLASSIFICATION & GRID
          </span>
        </div>
        <div className="text-[9px] text-slate-500 font-mono">
          <span className="text-white font-bold">{results.length}</span> DRIVERS
        </div>
      </div>

      {/* Table Column Titles */}
      <div className="grid grid-cols-12 px-1.5 py-0.5 border-b border-white/[0.04] text-[9px] font-bold text-slate-400 uppercase shrink-0">
        <span className="col-span-1 text-center">POS</span>
        <span className="col-span-1 text-center">NO</span>
        <span className="col-span-4">DRIVER</span>
        <span className="col-span-3">TEAM</span>
        <span className="col-span-2 text-right">TIME/GAP</span>
        <span className="col-span-1 text-right">PTS</span>
      </div>

      {/* Non-clickable high-density rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
        {results.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Classification data loading or session yet to take place.
          </div>
        ) : (
          results.map((row, idx) => {
            const isP1 = row.position === 1;
            const isPodium = (row.position || 0) > 0 && (row.position || 0) <= 3;

            return (
              <div
                key={row.driver_number || idx}
                className="grid grid-cols-12 items-center px-3 py-1 text-[11px] hover:bg-white/[0.02] cursor-default"
              >
                {/* Pos */}
                <div className="col-span-1 flex items-center justify-center font-bold">
                  {isP1 ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      P1
                    </span>
                  ) : isPodium ? (
                    <span className="text-slate-200">P{row.position}</span>
                  ) : (
                    <span className="text-slate-400">{row.position || idx + 1}</span>
                  )}
                </div>

                {/* Number */}
                <div className="col-span-1 text-center font-mono text-[10px] text-slate-500">
                  #{row.driver_number}
                </div>

                {/* Driver */}
                <div className="col-span-4 flex items-center gap-1.5 min-w-0 pr-1">
                  <span
                    className="w-1.5 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: row.team_color || '#888888' }}
                  />
                  <span className="font-bold text-white truncate font-mono text-[11px]">
                    {row.full_name || row.abbreviation}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">
                    {row.abbreviation}
                  </span>
                </div>

                {/* Team */}
                <div className="col-span-3 text-[10px] text-slate-400 truncate pr-1">
                  {row.team}
                </div>

                {/* Time / Gap */}
                <div className="col-span-2 text-right font-mono text-[10px] text-slate-300">
                  {row.time || (row.status === 'Finished' ? '+1 Lap' : row.status || '--')}
                </div>

                {/* Points */}
                <div className="col-span-1 text-right font-mono font-bold text-white text-[10px]">
                  {row.points !== null && row.points > 0 ? `+${row.points}` : '-'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
