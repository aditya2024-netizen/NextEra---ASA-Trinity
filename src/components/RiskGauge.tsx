import React from 'react';
import { RiskLevel } from '../types';

interface RiskGaugeProps {
  score: number;
  level?: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  level = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW',
  size = 'md',
  showLabels = true,
}) => {
  const clampedScore = Math.min(100, Math.max(0, score));

  // Determine badge colors
  const colorMap = {
    CRITICAL: {
      bg: 'bg-rose-100 border-rose-400 text-rose-900',
      fill: 'bg-rose-800',
      ring: 'ring-rose-700',
      pill: 'bg-rose-800 text-white',
      text: 'text-rose-900',
    },
    HIGH: {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      fill: 'bg-rose-600',
      ring: 'ring-rose-500',
      pill: 'bg-rose-600 text-white',
      text: 'text-rose-700',
    },
    MEDIUM: {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      fill: 'bg-amber-500',
      ring: 'ring-amber-500',
      pill: 'bg-amber-500 text-white',
      text: 'text-amber-700',
    },
    LOW: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      fill: 'bg-emerald-500',
      ring: 'ring-emerald-500',
      pill: 'bg-emerald-600 text-white',
      text: 'text-emerald-700',
    },
  };

  const currentTheme = colorMap[level] || colorMap.HIGH;

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3.5',
    lg: 'h-5',
  };

  return (
    <div className="w-full flex flex-col gap-1.5" id={`risk-gauge-${score}`}>
      {/* Visual Bar with 4 segments: Low (0-29%), Medium (30-59%), High (60-79%), Critical (80-100%) */}
      <div className="relative w-full">
        <div className={`w-full ${heightClasses[size]} rounded-full bg-slate-100 overflow-hidden flex border border-slate-200 shadow-inner`}>
          {/* Low Zone (0-29%) */}
          <div className="w-[30%] bg-emerald-100/90 border-r border-slate-300 relative">
            <span className="sr-only">Low Risk Range 0 to 29</span>
          </div>
          {/* Medium Zone (30-59%) */}
          <div className="w-[30%] bg-amber-100/90 border-r border-slate-300 relative">
            <span className="sr-only">Medium Risk Range 30 to 59</span>
          </div>
          {/* High Zone (60-79%) */}
          <div className="w-[20%] bg-rose-100/90 border-r border-slate-300 relative">
            <span className="sr-only">High Risk Range 60 to 79</span>
          </div>
          {/* Critical Zone (80-100%) */}
          <div className="w-[20%] bg-rose-300/90 relative">
            <span className="sr-only">Critical Risk Range 80 to 100</span>
          </div>
        </div>

        {/* Dynamic Needle / Marker */}
        <div 
          className="absolute -top-1 transition-all duration-700 ease-out flex flex-col items-center -translate-x-1/2 pointer-events-none"
          style={{ left: `${clampedScore}%` }}
        >
          <div className={`w-4 h-4 rounded-full ${currentTheme.fill} border-2 border-white shadow-md ring-2 ${currentTheme.ring}/30`}></div>
          <div className="w-0.5 h-3 bg-slate-700 -mt-1"></div>
        </div>
      </div>

      {/* Scale Labels */}
      {showLabels && (
        <div className="flex justify-between text-[10px] font-medium text-slate-700 px-0.5 select-none">
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            0-29 LOW
          </span>
          <span className="flex items-center gap-1 font-semibold text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
            30-59 MED
          </span>
          <span className="flex items-center gap-1 font-semibold text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
            60-79 HIGH
          </span>
          <span className="flex items-center gap-1 font-bold text-rose-900">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-800 inline-block"></span>
            80-100 CRIT
          </span>
        </div>
      )}
    </div>
  );
};
