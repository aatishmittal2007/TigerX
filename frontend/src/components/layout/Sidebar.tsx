import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  ListFilter,
  Share2,
  BookOpen,
  BarChart3,
  Cpu,
  Activity,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { UserProfile } from '../../types';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: UserProfile | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  collapsed,
  onToggleCollapse,
  user,
  onLogout
}) => {
  const mainNav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, path: '/' },
    { id: 'investigation', label: 'Investigations', icon: ShieldAlert, path: '/investigations' },
    { id: 'queue', label: 'Case Queue', icon: ListFilter, path: '/cases' },
    { id: 'network', label: 'Fraud Network', icon: Share2, path: '/network' },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, path: '/knowledge' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' }
  ];

  const systemNav = [
    { id: 'integrations', label: 'Integrations', icon: Cpu, path: '/integrations' },
    { id: 'health', label: 'System Health', icon: Activity, path: '/system-health' }
  ];

  const bottomNav = [
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  const renderNavItem = (item: { id: string; label: string; icon: any; path: string }) => {
    const Icon = item.icon;
    const isActive = currentPath === item.path || 
      (item.path !== '/' && currentPath.startsWith(item.path));

    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.path)}
        title={collapsed ? item.label : undefined}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
          isActive
            ? 'bg-teal-50 text-teal-800 font-semibold shadow-xs'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        } ${collapsed ? 'justify-center px-2' : ''}`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 flex flex-col justify-between transition-all duration-200 select-none z-20 shrink-0 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
          <div 
            onClick={() => onNavigate('/')}
            className="flex items-center space-x-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-700/20 font-bold shrink-0">
              <span className="text-sm tracking-tighter">TX</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">TigerX</span>
                <span className="text-[9px] font-medium text-teal-600 tracking-wider uppercase mt-1">Agentic Fraud</span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-6">
          <div className="space-y-1">
            {!collapsed && <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace</div>}
            {mainNav.map(renderNavItem)}
          </div>

          <div className="space-y-1">
            {!collapsed && <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Platform</div>}
            {systemNav.map(renderNavItem)}
          </div>

          <div className="space-y-1">
            {!collapsed && <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Preferences</div>}
            {bottomNav.map(renderNavItem)}
          </div>
        </div>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-slate-100">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.avatar || 'SC'}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'Sarah Chen'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.role || 'Senior Analyst'}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
