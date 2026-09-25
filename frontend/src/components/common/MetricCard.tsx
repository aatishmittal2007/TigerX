import React from 'react';
import { Card } from './Card';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendPositive = true,
  subtitle
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {trend && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            trendPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
    </Card>
  );
};
