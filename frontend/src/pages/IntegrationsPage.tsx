import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle2, RefreshCw, Database, Server, Workflow } from 'lucide-react';
import { IntegrationItem } from '../types';
import { fetchIntegrations } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetchIntegrations()
      .then(res => setIntegrations(res))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Platform Integrations</h2>
          <p className="text-xs text-slate-500 mt-1">
            Connected graph engines, agent APIs, and orchestration services
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadData}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Check Connectivity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item, idx) => (
          <Card key={idx} className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                  <span className="text-[11px] text-slate-400">{item.category}</span>
                </div>
              </div>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="capitalize">{item.status}</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{item.details}</p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Endpoint: {item.endpoint}</span>
              <span>{item.latency_ms} ms</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
