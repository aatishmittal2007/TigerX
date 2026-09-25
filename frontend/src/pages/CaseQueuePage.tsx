import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, Download } from 'lucide-react';
import { CaseSummary } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

interface CaseQueuePageProps {
  cases: CaseSummary[];
  onSelectCase: (caseId: string) => void;
}

export const CaseQueuePage: React.FC<CaseQueuePageProps> = ({ cases, onSelectCase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [triggerFilter, setTriggerFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'id' | 'prob' | 'exposure'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesSearch =
        c.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.card_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.flagged_txn_id.includes(searchTerm);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'FRAUD' && c.verdict === 'fraud') ||
        (statusFilter === 'LEGITIMATE' && c.verdict === 'legitimate') ||
        (statusFilter === 'UNCERTAIN' && c.verdict === 'uncertain');

      const matchesTrigger =
        triggerFilter === 'ALL' ||
        c.trigger_type.toLowerCase() === triggerFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesTrigger;
    }).sort((a, b) => {
      let comp = 0;
      if (sortBy === 'id') comp = a.case_id.localeCompare(b.case_id);
      else if (sortBy === 'prob') comp = a.fraud_probability - b.fraud_probability;
      else if (sortBy === 'exposure') comp = a.exposure_usd - b.exposure_usd;
      return sortOrder === 'desc' ? -comp : comp;
    });
  }, [cases, searchTerm, statusFilter, triggerFilter, sortBy, sortOrder]);

  const toggleSort = (col: 'id' | 'prob' | 'exposure') => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Investigation Case Queue</h2>
          <p className="text-xs text-slate-500 mt-1">
            Prioritized alert triage across all 20 benchmark investigations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-xs">
            Showing {filteredCases.length} of {cases.length} cases
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by Case, Customer, Card, or Txn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Verdict:</span>
            {['ALL', 'FRAUD', 'LEGITIMATE'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${
                  statusFilter === s
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}

            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-2 mr-1">Trigger:</span>
            {['ALL', 'risk_score', 'customer_report', 'analyst_request'].map((t) => (
              <button
                key={t}
                onClick={() => setTriggerFilter(t)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${
                  triggerFilter === t
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'ALL' ? 'ALL' : t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Case Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider select-none">
                <th 
                  onClick={() => toggleSort('id')} 
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Case ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Trigger</th>
                <th className="py-3 px-4">Customer & Card</th>
                <th className="py-3 px-4">Flagged Txn</th>
                <th className="py-3 px-4">Model Score</th>
                <th 
                  onClick={() => toggleSort('prob')} 
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Fraud Probability</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Detected Pattern</th>
                <th 
                  onClick={() => toggleSort('exposure')} 
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Exposure</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">SAR Regulatory</th>
                <th className="py-3 px-4">Approval</th>
                <th className="py-3 px-4 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((c) => (
                <tr
                  key={c.case_id}
                  onClick={() => onSelectCase(c.case_id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-teal-700 transition">
                    {c.case_id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium capitalize">
                      {c.trigger_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{c.customer_id}</span>
                    <span className="text-slate-400 block text-[11px] font-mono">{c.card_id}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">#{c.flagged_txn_id}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {c.risk_score !== null ? c.risk_score.toFixed(2) : '--'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant={c.verdict === 'fraud' ? 'fraud' : c.verdict === 'legitimate' ? 'legitimate' : 'uncertain'}>
                        {c.verdict}
                      </Badge>
                      <span className="font-mono font-bold text-slate-800">
                        {Math.round(c.fraud_probability * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {c.pattern.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    ${c.exposure_usd.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    {c.sar_filed ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                        FILED
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                        NOT REQUIRED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      c.approval_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                      c.approval_status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {c.approval_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(c.case_id);
                      }}
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Investigate
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
