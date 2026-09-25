import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-600 shrink-0" />
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start space-x-3 w-80 bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-lg shadow-slate-200/50 animate-in slide-in-from-bottom-2 duration-150"
        >
          <div className="pt-0.5">{icons[t.type]}</div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
            {t.message && <p className="text-[11px] text-slate-500 mt-0.5">{t.message}</p>}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
