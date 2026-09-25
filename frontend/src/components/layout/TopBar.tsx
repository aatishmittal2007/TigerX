import React from 'react';
import { Search, Bell, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import { UserProfile } from '../../types';

interface TopBarProps {
  breadcrumbs: Array<{ label: string; path?: string }>;
  onNavigate: (path: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh?: () => void;
  user: UserProfile | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  breadcrumbs,
  onNavigate,
  searchQuery,
  onSearchChange,
  onRefresh,
  user
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-10 select-none">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs font-medium text-slate-500">
        {breadcrumbs.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-slate-300">/</span>}
            {b.path ? (
              <button
                onClick={() => onNavigate(b.path!)}
                className="hover:text-slate-900 transition-colors"
              >
                {b.label}
              </button>
            ) : (
              <span className="text-slate-900 font-semibold">{b.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Center Global Search */}
      <div className="w-96 max-w-sm hidden md:block">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cases, cards, customers (e.g. HHG-014, C13487)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Status Indicator */}
        <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/70 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>TigerGraph Engine Connected</span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh Live Data"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Notifications */}
        <button
          title="Notifications"
          className="relative p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-500"></span>
        </button>

        {/* Profile Avatar Pill */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
            {user?.avatar || 'SC'}
          </div>
          <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
            {user?.name || 'Sarah Chen'}
          </span>
        </div>
      </div>
    </header>
  );
};
