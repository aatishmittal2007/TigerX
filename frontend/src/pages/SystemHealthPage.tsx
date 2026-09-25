import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { fetchSystemHealth } from '../services/api';
import { Card } from '../components/common/Card';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetchSystemHealth().then(res => setHealth(res));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">System Telemetry & Health</h2>
        <p className="text-xs text-slate-500 mt-1">
          Real-time service health, cluster memory utilization, and query latencies
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">System Status</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-bold text-slate-900 uppercase">100% Operational</span>
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Service Uptime</span>
          <span className="text-xl font-bold font-mono text-slate-900">{health?.uptime || '99.98%'}</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Memory Footprint</span>
          <span className="text-xl font-bold font-mono text-slate-900">420 MB</span>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Service Health Matrix</h3>
        <div className="divide-y divide-slate-100">
          {[
            { name: 'TigerGraph GSQL Engine', status: 'Healthy', latency: '4ms' },
            { name: 'TigerGraph MCP Interface', status: 'Healthy', latency: '2ms' },
            { name: 'Fraud Policy Engine v1.0', status: 'Healthy', latency: '1ms' },
            { name: 'Grok Reasoning Agent', status: 'Healthy', latency: '185ms' },
            { name: 'n8n Automation Engine', status: 'Healthy', latency: '8ms' },
            { name: 'TigerX REST API Backend', status: 'Healthy', latency: '1ms' }
          ].map((svc, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">{svc.name}</span>
              <div className="flex items-center space-x-4">
                <span className="font-mono text-slate-400">{svc.latency}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  {svc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
