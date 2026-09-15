import React, { useEffect, useState } from 'react';
import { Loader2, Cpu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TelemetryLoadingProps {
  message?: string;
  submessage?: string;
  showPercentage?: boolean;
}

export const TelemetryLoading: React.FC<TelemetryLoadingProps> = ({
  message = 'INITIALIZING TELEMETRY ENGINE',
  submessage = 'Querying FastF1 cache and compiling weekend intelligence...',
  showPercentage = true,
}) => {
  const { theme } = useTheme();
  const [percent, setPercent] = useState<number>(14);
  const [stepIndex, setStepIndex] = useState<number>(0);

  const steps = [
    'Connecting to FastF1 telemetry cache...',
    'Parsing 20-car classification and intervals...',
    'Aligning SVD corner geometry and DRS zones...',
    'Extracting weekend sensor weather & stewards docs...',
    'Synchronizing telemetry payload streams...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 96) return prev;
        const delta = Math.floor(Math.random() * 15) + 6;
        return Math.min(prev + delta, 98);
      });
    }, 250);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 800);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [steps.length]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#10131C] border border-white/10 rounded-lg p-6 shadow-2xl max-w-md w-full flex flex-col items-center text-center relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-1 transition-all duration-200"
          style={{
            width: `${percent}%`,
            backgroundColor: theme.primaryColor,
            boxShadow: `0 0 16px ${theme.primaryColor}`
          }}
        />

        <div className="relative mb-4">
          <div
            className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center"
            style={{ boxShadow: `0 0 20px ${theme.glowColor}` }}
          >
            <Cpu className="w-8 h-8" style={{ color: theme.primaryColor }} />
          </div>
          <Loader2
            className="w-20 h-20 absolute -top-2 -left-2 animate-spin text-white/20"
            style={{ borderTopColor: theme.primaryColor }}
          />
        </div>

        <div className="font-orbitron font-bold text-base text-white tracking-widest mb-1">
          {message}
        </div>

        <div className="text-[11px] font-mono text-slate-400 mb-4">
          {submessage}
        </div>

        {showPercentage && (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500 truncate max-w-[240px]">
                &gt; {steps[stepIndex]}
              </span>
              <span className="font-bold" style={{ color: theme.primaryColor }}>
                {percent}%
              </span>
            </div>

            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${percent}%`,
                  backgroundColor: theme.primaryColor,
                  boxShadow: `0 0 12px ${theme.primaryColor}`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
