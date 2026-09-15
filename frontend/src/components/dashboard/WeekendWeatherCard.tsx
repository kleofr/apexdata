import React from 'react';
import { CloudRain, Sun, Wind, Thermometer } from 'lucide-react';
import { WeekendWeather } from '../../types/dashboard';
import { useTheme } from '../../context/ThemeContext';

interface WeekendWeatherCardProps {
  weather: WeekendWeather;
}

export const WeekendWeatherCard: React.FC<WeekendWeatherCardProps> = ({ weather }) => {
  const { theme } = useTheme();
  const days = [weather.friday, weather.saturday, weather.sunday].filter(Boolean);

  return (
    <div className="h-full flex flex-col bg-[#090B10] border border-white/10 rounded overflow-hidden select-none font-mono text-xs">
      {/* Header */}
      <div className="px-3 py-1.5 bg-[#0E1118] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <CloudRain className="w-3.5 h-3.5" style={{ color: theme.primaryColor }} />
          <span className="font-orbitron font-bold text-[11px] text-white tracking-wider uppercase">
            3-DAY GRAND PRIX WEEKEND WEATHER
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">TRACK & AIR METRICS</span>
      </div>

      {/* Weather 3-Day Columns */}
      <div className="p-2 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 overflow-hidden">
        {days.map((d) => {
          const isRainRisk = d.rain_probability_pct >= 40;

          return (
            <div
              key={d.day}
              className="p-2 rounded bg-white/[0.02] border border-white/5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-1">
                <div>
                  <div className="font-bold text-white font-orbitron text-[11px] uppercase">{d.day}</div>
                  <div className="text-[9px] text-slate-400">{d.sessions}</div>
                </div>
                {isRainRisk ? (
                  <CloudRain className="w-4 h-4 text-cyan-400 shrink-0" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                )}
              </div>

              <div className="space-y-1 my-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-red-400" />
                    TRACK TEMP:
                  </span>
                  <span className="font-bold text-red-400">{d.track_temp_c}°C</span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-slate-400" />
                    AIR TEMP:
                  </span>
                  <span className="font-bold text-slate-200">{d.air_temp_c}°C</span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Wind className="w-3 h-3 text-slate-400" />
                    WIND SPEED:
                  </span>
                  <span className="text-slate-300">{d.wind_kmh} km/h</span>
                </div>
              </div>

              <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">RAIN CHANCE:</span>
                <span className={`font-bold ${isRainRisk ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {d.rain_probability_pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
