import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Share2,
  ArrowRight,
  TrendingUp,
  Clock,
  ExternalLink,
  Play
} from 'lucide-react';
import { CaseSummary, AnalyticsData } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

interface DashboardPageProps {
  cases: CaseSummary[];
  analytics: AnalyticsData | null;
  onSelectCase: (caseId: string) => void;
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  cases,
  analytics,
  onSelectCase,
  onNavigate
}) => {
  const openCasesCount = cases.length;
  const highRiskCount = cases.filter(c => c.verdict === 'fraud').length;
  const clearedCount = cases.filter(c => c.verdict === 'legitimate').length;
  const totalExposure = cases.reduce((acc, c) => acc + c.exposure_usd, 0);

  // Recent investigation highlights
  const recentActivity = [
    {
      caseId: 'HHG-014',
      title: 'Undocumented Device Ring Detected',
      details: '51 cards linked to anonymous proxy device profile',
      time: 'Just now',
      priority: 'CRITICAL',
      type: 'fraud'
    },
    {
      caseId: 'HHG-005',
      title: 'Rapid Online Card Testing Sequence',
      details: '3 micro-authorizations under $5 before $259 purchase',
      time: '4 mins ago',
      priority: 'HIGH',
      type: 'fraud'
    },
    {
      caseId: 'HHG-001',
      title: 'Out-of-Region False Alarm Cleared',
      details: 'Cardholder confirmed 15 prior transactions in region 444.0',
      time: '12 mins ago',
      priority: 'CLEARED',
      type: 'legitimate'
    },
    {
      caseId: 'HHG-007',
      title: 'High-Score Travel False Positive Cleared',
      details: 'Risk score 0.87 cleared; 2,552 historical transactions in home zone',
      time: '25 mins ago',
      priority: 'CLEARED',
      type: 'legitimate'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Good morning, Analyst
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            TigerX Autonomous Fraud Investigation Intelligence Workspace
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('/cases')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Open Case Queue
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSelectCase('HHG-014')}
            icon={<Play className="w-3.5 h-3.5" />}
          >
            Investigate HHG-014 (Device Ring)
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Active Cases"
          value={openCasesCount}
          icon={<ShieldAlert className="w-4 h-4" />}
          subtitle="Benchmark portfolio (Nov-Dec 2016)"
        />
        <MetricCard
          label="Confirmed Fraud"
          value={highRiskCount}
          icon={<AlertTriangle className="w-4 h-4" />}
          trend={`${highRiskCount} / 20`}
          trendPositive={false}
          subtitle="SAR filings & block recommendations"
        />
        <MetricCard
          label="Cleared False Alarms"
          value={clearedCount}
          icon={<CheckCircle2 className="w-4 h-4" />}
          trend="Calibrated"
          trendPositive={true}
          subtitle="Cleared under Policy Rule R3"
        />
        <MetricCard
          label="Total Identified Exposure"
          value={`$${totalExposure.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-4 h-4" />}
          subtitle="Aggregated across active fraud episodes"
        />
      </div>

      {/* Two Column Layout: Activity & Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity Feed (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Investigation Activity</h3>
                <p className="text-xs text-slate-500">Autonomous graph traversal and policy enforcement stream</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('/cases')}
                className="text-xs"
              >
                View all cases
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentActivity.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectCase(item.caseId)}
                  className="py-3.5 flex items-start justify-between hover:bg-slate-50/80 px-2 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      item.type === 'fraud' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {item.caseId.split('-')[1]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">
                          {item.caseId}
                        </span>
                        <span className="text-xs font-medium text-slate-700">· {item.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.details}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block">{item.time}</span>
                    <Badge
                      size="sm"
                      variant={item.type === 'fraud' ? 'fraud' : 'legitimate'}
                      className="mt-1"
                    >
                      {item.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Risk Overview & Calibrated Distribution (1 Col) */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Risk Calibration</h3>
            <p className="text-xs text-slate-500 mb-4">Probability distribution across 20 benchmark alerts</p>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-rose-700">Critical (Prob ≥ 80%)</span>
                  <span className="font-mono font-bold text-slate-800">
                    {cases.filter(c => c.fraud_probability >= 0.8).length} cases
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-600 rounded-full transition-all duration-500"
                    style={{ width: `${(cases.filter(c => c.fraud_probability >= 0.8).length / cases.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-amber-700">High Risk (60% - 79%)</span>
                  <span className="font-mono font-bold text-slate-800">
                    {cases.filter(c => c.fraud_probability >= 0.6 && c.fraud_probability < 0.8).length} cases
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${(cases.filter(c => c.fraud_probability >= 0.6 && c.fraud_probability < 0.8).length / cases.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-emerald-700">Low / False Alarm (≤ 30%)</span>
                  <span className="font-mono font-bold text-slate-800">
                    {cases.filter(c => c.fraud_probability <= 0.3).length} cases
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(cases.filter(c => c.fraud_probability <= 0.3).length / cases.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-xl bg-teal-50/60 border border-teal-200/60">
              <span className="text-xs font-bold text-teal-900 block mb-0.5">Policy R1 Enforcement</span>
              <p className="text-[11px] text-teal-800/90 leading-relaxed">
                Weak risk signals trigger customer verification before destructive card blocks, saving legitimate customers from false block interruptions.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Active Investigations Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Investigation Queue</h3>
            <p className="text-xs text-slate-500">Live triage table with risk probabilities, patterns, and exposure</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('/cases')}
            icon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            Advanced Queue Filtering
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-2.5">Case ID</th>
                <th className="pb-2.5">Customer / Card</th>
                <th className="pb-2.5">Trigger</th>
                <th className="pb-2.5">Verdict</th>
                <th className="pb-2.5">Fraud Prob</th>
                <th className="pb-2.5">Pattern</th>
                <th className="pb-2.5">Exposure</th>
                <th className="pb-2.5">Approval</th>
                <th className="pb-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.slice(0, 8).map((c) => (
                <tr
                  key={c.case_id}
                  onClick={() => onSelectCase(c.case_id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 font-mono font-bold text-slate-900">{c.case_id}</td>
                  <td className="py-3">
                    <span className="font-semibold text-slate-800">{c.customer_id}</span>
                    <span className="text-slate-400 block text-[11px] font-mono">{c.card_id}</span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">
                      {c.trigger_type}
                    </span>
                  </td>
                  <td className="py-3">
                    <Badge variant={c.verdict === 'fraud' ? 'fraud' : c.verdict === 'legitimate' ? 'legitimate' : 'uncertain'}>
                      {c.verdict}
                    </Badge>
                  </td>
                  <td className="py-3 font-mono font-semibold">
                    <span className={c.fraud_probability >= 0.75 ? 'text-rose-600' : c.fraud_probability <= 0.3 ? 'text-emerald-600' : 'text-amber-600'}>
                      {Math.round(c.fraud_probability * 100)}%
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 font-medium">{c.pattern.replace(/_/g, ' ')}</td>
                  <td className="py-3 font-mono font-bold text-slate-800">
                    ${c.exposure_usd.toFixed(2)}
                  </td>
                  <td className="py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      c.approval_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                      c.approval_status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {c.approval_status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(c.case_id);
                      }}
                      className="text-teal-700 hover:text-teal-800"
                    >
                      Open Workspace →
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
