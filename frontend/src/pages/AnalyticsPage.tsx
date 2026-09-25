import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, PieChart, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AnalyticsData } from '../types';
import { fetchAnalytics } from '../services/api';
import { Card } from '../components/common/Card';
import { MetricCard } from '../components/common/MetricCard';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then(res => setData(res))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="h-96 flex items-center justify-center text-xs text-slate-400">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Investigation Analytics & Benchmark Metrics</h2>
        <p className="text-xs text-slate-500 mt-1">
          Ground-truth portfolio performance across the 20 benchmark investigations
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Exposure Identified"
          value={`$${data.total_exposure_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-4 h-4" />}
          subtitle="All confirmed fraud cases"
        />
        <MetricCard
          label="SAR Filing Rate"
          value={`${data.sar_filing_rate}%`}
          icon={<ShieldAlert className="w-4 h-4" />}
          subtitle={`${data.sar_count} regulatory filings`}
        />
        <MetricCard
          label="False Alarm Rate"
          value={`${data.false_alarm_rate}%`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          subtitle="Cleared legitimate activity"
        />
        <MetricCard
          label="Avg Investigation Latency"
          value={`${data.average_investigation_time_s}s`}
          icon={<BarChart3 className="w-4 h-4" />}
          subtitle="Autonomous agent execution"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Typology Breakdown */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Fraud by Typology</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution of confirmed patterns</p>

          <div className="space-y-3">
            {Object.entries(data.pattern_distribution).map(([pat, count]) => (
              <div key={pat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 capitalize">{pat.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-slate-900 font-bold">{count} cases</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full"
                    style={{ width: `${(count / data.total_cases) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Exposure by Typology */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Exposure by Typology (USD)</h3>
          <p className="text-xs text-slate-500 mb-4">Financial volume identified across fraud patterns</p>

          <div className="space-y-3">
            {Object.entries(data.exposure_by_pattern).map(([pat, amt]) => (
              <div key={pat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 capitalize">{pat.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-slate-900 font-bold">${amt.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full"
                    style={{ width: `${data.total_exposure_usd > 0 ? (amt / data.total_exposure_usd) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
