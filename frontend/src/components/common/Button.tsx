import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  
  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-xs font-semibold px-3.5 py-2 gap-2",
    lg: "text-sm font-semibold px-4 py-2.5 gap-2"
  };

  const variantStyles = {
    primary: "bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-700/20 focus:ring-teal-500",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm focus:ring-slate-300",
    outline: "bg-transparent hover:bg-teal-50 text-teal-700 border border-teal-600/30 focus:ring-teal-500",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-700/20 focus:ring-rose-500",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-300"
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
