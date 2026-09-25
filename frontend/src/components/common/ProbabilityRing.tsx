import React from 'react';

interface ProbabilityRingProps {
  probability: number;
  size?: number;
  strokeWidth?: number;
}

export const ProbabilityRing: React.FC<ProbabilityRingProps> = ({
  probability,
  size = 54,
  strokeWidth = 4.5
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - probability * circumference;
  
  // Color determination based on risk thresholds
  let strokeColor = '#10B981'; // Green (<= 0.3)
  if (probability >= 0.75) strokeColor = '#E11D48'; // Red (>= 0.75)
  else if (probability >= 0.4) strokeColor = '#D97706'; // Amber (0.4 - 0.75)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-bold font-mono text-slate-800">
        {Math.round(probability * 100)}%
      </span>
    </div>
  );
};
