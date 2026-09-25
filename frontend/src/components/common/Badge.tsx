import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'fraud' | 'legitimate' | 'uncertain' | 'neutral' | 'teal' | 'auto' | 'L1' | 'L2';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}) => {
  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 font-medium rounded",
    md: "text-xs px-2.5 py-1 font-semibold rounded-md"
  };

  const variantStyles = {
    fraud: "bg-rose-50 text-rose-700 border border-rose-200",
    legitimate: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    uncertain: "bg-amber-50 text-amber-700 border border-amber-200",
    neutral: "bg-slate-100 text-slate-600 border border-slate-200",
    teal: "bg-teal-50 text-teal-700 border border-teal-200",
    auto: "bg-sky-50 text-sky-700 border border-sky-200",
    L1: "bg-purple-50 text-purple-700 border border-purple-200",
    L2: "bg-indigo-50 text-indigo-700 border border-indigo-200"
  };

  return (
    <span className={`inline-flex items-center tracking-tight uppercase ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
