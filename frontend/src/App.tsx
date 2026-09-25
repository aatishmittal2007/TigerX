import React, { useState, useEffect } from 'react';
import { UserProfile, CaseSummary, AnalyticsData } from './types';
import { fetchCases, fetchAnalytics } from './services/api';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ToastContainer, ToastMessage } from './components/common/Toast';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CaseQueuePage } from './pages/CaseQueuePage';
import { InvestigationWorkspace } from './pages/InvestigationWorkspace';
import { NetworkExplorerPage } from './pages/NetworkExplorerPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('tigerx_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentPath, setCurrentPath] = useState<string>('/');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('HHG-014');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadData = async () => {
    try {
      const [casesRes, analyticsRes] = await Promise.all([
        fetchCases(),
        fetchAnalytics()
      ]);
      setCases(casesRes);
      setAnalytics(analyticsRes);
    } catch {
      // API loading fallback
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('tigerx_user', JSON.stringify(profile));
    addToast('success', `Welcome back, ${profile.name}`, 'TigerX Investigation workspace ready.');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tigerx_user');
    setCurrentPath('/');
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentPath(`/investigations/${caseId}`);
  };

  // Breadcrumbs generator
  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'TigerX', path: '/' }];
    if (currentPath === '/') {
      crumbs.push({ label: 'Overview', path: '/' });
    } else if (currentPath === '/cases') {
      crumbs.push({ label: 'Case Queue', path: '/cases' });
    } else if (currentPath.startsWith('/investigations')) {
      crumbs.push({ label: 'Investigations', path: '/cases' });
      crumbs.push({ label: selectedCaseId, path: `/investigations/${selectedCaseId}` });
    } else if (currentPath === '/network') {
      crumbs.push({ label: 'Fraud Network', path: '/network' });
    } else if (currentPath === '/knowledge') {
      crumbs.push({ label: 'Knowledge Base', path: '/knowledge' });
    } else if (currentPath === '/analytics') {
      crumbs.push({ label: 'Analytics', path: '/analytics' });
    } else if (currentPath === '/integrations') {
      crumbs.push({ label: 'Integrations', path: '/integrations' });
    } else if (currentPath === '/system-health') {
      crumbs.push({ label: 'System Health', path: '/system-health' });
    } else if (currentPath === '/settings') {
      crumbs.push({ label: 'Settings', path: '/settings' });
    }
    return crumbs;
  };

  if (!user) {
    return (
      <>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={(path) => {
          if (path === '/investigations') {
            setCurrentPath(`/investigations/${selectedCaseId}`);
          } else {
            setCurrentPath(path);
          }
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar */}
        <TopBar
          breadcrumbs={getBreadcrumbs()}
          onNavigate={(path) => setCurrentPath(path)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={loadData}
          user={user}
        />

        {/* Scrollable Workspace Pages */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/60">
          <div className="max-w-7xl mx-auto">
            {currentPath === '/' && (
              <DashboardPage
                cases={cases}
                analytics={analytics}
                onSelectCase={handleSelectCase}
                onNavigate={(path) => setCurrentPath(path)}
              />
            )}

            {currentPath === '/cases' && (
              <CaseQueuePage
                cases={cases}
                onSelectCase={handleSelectCase}
              />
            )}

            {currentPath.startsWith('/investigations') && (
              <InvestigationWorkspace
                caseId={selectedCaseId}
                onBack={() => setCurrentPath('/cases')}
                onToast={addToast}
              />
            )}

            {currentPath === '/network' && (
              <NetworkExplorerPage
                onSelectCase={handleSelectCase}
              />
            )}

            {currentPath === '/knowledge' && (
              <KnowledgePage />
            )}

            {currentPath === '/analytics' && (
              <AnalyticsPage />
            )}

            {currentPath === '/integrations' && (
              <IntegrationsPage />
            )}

            {currentPath === '/system-health' && (
              <SystemHealthPage />
            )}

            {currentPath === '/settings' && (
              <SettingsPage />
            )}
          </div>
        </main>
      </div>

      {/* Global Notifications Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
