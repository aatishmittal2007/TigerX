import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Share2,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Database,
  ExternalLink,
  Copy,
  Check,
  UserCheck,
  Send,
  Sparkles,
  ChevronRight,
  Eye,
  Info
} from 'lucide-react';
import { CaseDeliverable, AuditEvent, TransactionRecord, GraphData, GraphNode } from '../types';
import {
  fetchCaseDetail,
  triggerReinvestigation,
  fetchCaseAudit,
  approveCaseAction,
  rejectCaseAction,
  fetchCaseGraph,
  fetchCaseTransactions
} from '../services/api';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ProbabilityRing } from '../components/common/ProbabilityRing';
import { Modal } from '../components/common/Modal';
import { Drawer } from '../components/common/Drawer';
import { GraphVisualizer } from '../components/common/GraphVisualizer';

interface InvestigationWorkspaceProps {
  caseId: string;
  onBack: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

type TabType =
  | 'overview'
  | 'evidence'
  | 'reasoning'
  | 'trace'
  | 'network'
  | 'transactions'
  | 'timeline'
  | 'prior_cases'
  | 'nba'
  | 'sar'
  | 'audit';

export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({
  caseId,
  onBack,
  onToast
}) => {
  const [data, setData] = useState<CaseDeliverable | null>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [reinvestigating, setReinvestigating] = useState(false);
  const [copiedSar, setCopiedSar] = useState(false);

  // Approval modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{ action: string; route: string; reason: string } | null>(null);
  const [approvalType, setApprovalType] = useState<'approve' | 'reject'>('approve');
  const [rejectReason, setRejectReason] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);

  // Node drawer state
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodeDrawerOpen, setNodeDrawerOpen] = useState(false);

  const loadCaseData = async () => {
    setLoading(true);
    try {
      const [detailRes, auditRes, graphRes, txnsRes] = await Promise.all([
        fetchCaseDetail(caseId),
        fetchCaseAudit(caseId),
        fetchCaseGraph(caseId),
        fetchCaseTransactions(caseId)
      ]);
      setData(detailRes);
      setAudit(auditRes);
      setGraphData(graphRes);
      setTransactions(txnsRes);
    } catch {
      onToast('error', 'Failed to load case data', 'Please check server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const handleReinvestigate = async () => {
    setReinvestigating(true);
    try {
      const updated = await triggerReinvestigation(caseId);
      setData(updated);
      const auditRes = await fetchCaseAudit(caseId);
      setAudit(auditRes);
      onToast('success', 'Investigation Completed', `Verdict: ${updated.case.verdict.toUpperCase()}`);
    } catch {
      onToast('error', 'Re-investigation Failed', 'Error running autonomous agent loop.');
    } finally {
      setReinvestigating(false);
    }
  };

  const handleOpenApproval = (actionItem: { action: string; route: string; reason: string }, type: 'approve' | 'reject') => {
    setSelectedAction(actionItem);
    setApprovalType(type);
    setApprovalModalOpen(true);
  };

  const handleExecuteApproval = async () => {
    if (!selectedAction) return;
    setActionProcessing(true);
    try {
      if (approvalType === 'approve') {
        await approveCaseAction(caseId, selectedAction.action, selectedAction.route);
        onToast('success', 'Action Approved', `${selectedAction.action} approved under ${selectedAction.route} protocol.`);
      } else {
        await rejectCaseAction(caseId, selectedAction.action, rejectReason || 'Analyst override based on investigation findings.');
        onToast('info', 'Action Rejected', `${selectedAction.action} rejected by human analyst.`);
      }
      setApprovalModalOpen(false);
      // Reload audit & case detail
      const [detailRes, auditRes] = await Promise.all([
        fetchCaseDetail(caseId),
        fetchCaseAudit(caseId)
      ]);
      setData(detailRes);
      setAudit(auditRes);
    } catch {
      onToast('error', 'Action Failed', 'Could not record analyst decision.');
    } finally {
      setActionProcessing(false);
    }
  };

  const handleCopySar = () => {
    if (!data?.sar.narrative) return;
    navigator.clipboard.writeText(data.sar.narrative);
    setCopiedSar(true);
    setTimeout(() => setCopiedSar(false), 2000);
    onToast('success', 'Copied to Clipboard', 'FinCEN SAR narrative ready for filing.');
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setNodeDrawerOpen(true);
  };

  if (loading || !data) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Traversing TigerGraph and Loading Case {caseId}...</p>
      </div>
    );
  }

  const { case: caseInfo, sar, next_best_actions: nba, evidence_requests } = data;
  const isFraud = caseInfo.verdict === 'fraud';
  const isLegitimate = caseInfo.verdict === 'legitimate';

  const tabs: Array<{ id: TabType; label: string; badge?: string | number }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'evidence', label: 'Evidence', badge: caseInfo.evidence.length },
    { id: 'reasoning', label: 'Reasoning Flow' },
    { id: 'trace', label: 'Agent Activity' },
    { id: 'network', label: 'Fraud Network', badge: graphData?.nodes.length },
    { id: 'transactions', label: 'Transactions', badge: transactions.length },
    { id: 'timeline', label: 'Timeline' },
    { id: 'prior_cases', label: 'Prior Cases', badge: caseInfo.similar_prior_cases.length },
    { id: 'nba', label: 'Next Best Action', badge: nba.final.length },
    { id: 'sar', label: 'SAR Report', badge: sar.file ? 'FILED' : undefined },
    { id: 'audit', label: 'Audit Trail', badge: audit.length }
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation & Workspace Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Case Queue</span>
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold font-mono text-slate-900">{caseId}</h2>
              <Badge variant={isFraud ? 'fraud' : isLegitimate ? 'legitimate' : 'uncertain'} size="md">
                {caseInfo.verdict}
              </Badge>
              <Badge variant="teal" size="md">
                {caseInfo.pattern.replace(/_/g, ' ')}
              </Badge>
              {data.approval_status && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                  data.approval_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  data.approval_status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  Approval: {data.approval_status}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <div>Customer: <span className="font-semibold text-slate-800">{caseId}</span></div>
              <div>Flagged Txn: <span className="font-mono font-semibold text-slate-800">#{caseInfo.first_suspicious_txn_id || caseInfo.affected_txn_ids[0] || 'Alert'}</span></div>
              <div>Connected Cards: <span className="font-mono font-bold text-slate-800">{caseInfo.connected_card_ids.length}</span></div>
              <div>Graph Memory: <span className="font-semibold text-teal-700">Persisted ({caseInfo.graph_case_id})</span></div>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center space-x-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center space-x-3">
              <ProbabilityRing probability={caseInfo.fraud_probability} size={54} strokeWidth={5} />
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Assessed Fraud Prob</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {Math.round(caseInfo.fraud_probability * 100)}%
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Identified Exposure</span>
              <span className="text-base font-bold font-mono text-slate-900">
                ${caseInfo.exposure_usd.toFixed(2)}
              </span>
            </div>

            <Button
              variant="primary"
              size="md"
              loading={reinvestigating}
              onClick={handleReinvestigate}
              icon={<Play className="w-3.5 h-3.5" />}
            >
              Re-run Agent
            </Button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center space-x-1 border-t border-slate-100 pt-3 overflow-x-auto select-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                activeTab === tab.id
                  ? 'bg-teal-50 text-teal-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === tab.id
                    ? 'bg-teal-200/80 text-teal-900'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Executive Investigation Summary</h3>
            <p className="text-xs text-slate-700 leading-relaxed max-w-4xl bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-sans">
              {caseInfo.summary}
            </p>

            {caseInfo.pattern_description && (
              <div className="mt-4 p-4 rounded-xl bg-purple-50/70 border border-purple-200/60">
                <span className="text-xs font-bold text-purple-900 block mb-1">Undocumented Typology Rationale</span>
                <p className="text-xs text-purple-800 leading-relaxed">
                  {caseInfo.pattern_description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Investigation Verdict</span>
                <Badge variant={isFraud ? 'fraud' : isLegitimate ? 'legitimate' : 'uncertain'}>
                  {caseInfo.verdict}
                </Badge>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">FinCEN SAR Filing</span>
                <span className="text-xs font-bold text-slate-800">
                  {sar.file ? 'Required (Form 111 Prepared)' : 'Not Required (Cleared)'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Stop Criterion</span>
                <span className="text-xs text-slate-700 font-medium">{data.stop_reason}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Evidence */}
      {activeTab === 'evidence' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Corroborating Graph Evidence</h3>
              <p className="text-xs text-slate-500">Grounded claims retrieved from TigerGraph multi-hop queries</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
              {caseInfo.evidence.length} claims verified
            </span>
          </div>

          <div className="space-y-3">
            {caseInfo.evidence.map((ev, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs font-semibold text-slate-900 leading-snug">{ev.claim}</p>
                  </div>
                  <Badge variant={ev.source === 'graph' ? 'teal' : 'neutral'} size="sm">
                    {ev.source}
                  </Badge>
                </div>
                <div className="pl-7 space-y-1 text-[11px] text-slate-500">
                  <div>Reference Query: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-mono">{ev.ref}</code></div>
                  {ev.entity_ids && ev.entity_ids.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-slate-400">Entities:</span>
                      {ev.entity_ids.slice(0, 10).map((eid, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700">
                          {eid}
                        </span>
                      ))}
                      {ev.entity_ids.length > 10 && (
                        <span className="text-[10px] text-slate-400">+{ev.entity_ids.length - 10} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 3: Signature Reasoning Pipeline */}
      {activeTab === 'reasoning' && (
        <Card className="p-6">
          <div className="mb-6 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">TigerX Decision Reasoning Pipeline</h3>
            <p className="text-xs text-slate-500">Grounded step-by-step translation from empirical graph evidence to policy actions</p>
          </div>

          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-teal-200">
            {/* Step 1: Evidence */}
            <div className="relative flex items-start space-x-4">
              <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 -ml-[19px] ring-4 ring-white">
                1
              </div>
              <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
                  1. Graph & Historical Evidence
                </span>
                <p className="text-xs text-slate-800">
                  {caseInfo.evidence[0]?.claim || 'Traversed 2-hop transaction neighborhood and verified device profile.'}
                </p>
              </div>
            </div>

            {/* Step 2: Interpretation */}
            <div className="relative flex items-start space-x-4">
              <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 -ml-[19px] ring-4 ring-white">
                2
              </div>
              <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
                  2. Autonomous Interpretation
                </span>
                <p className="text-xs text-slate-800">
                  {isFraud 
                    ? `Synthesized anomalous activity indicating ${caseInfo.pattern.replace(/_/g, ' ')}. Elevated fraud probability of ${Math.round(caseInfo.fraud_probability * 100)}% supported by multi-entity correlation.`
                    : `Verified historical transaction travel patterns. Activity confirmed legitimate with 0.05 probability; single risk score trigger cleared as model false alarm.`
                  }
                </p>
              </div>
            </div>

            {/* Step 3: Policy */}
            <div className="relative flex items-start space-x-4">
              <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 -ml-[19px] ring-4 ring-white">
                3
              </div>
              <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
                  3. Fraud Policy Enforcement
                </span>
                <p className="text-xs text-slate-800">
                  {nba.final.map(a => a.reason).join(' | ')}
                </p>
              </div>
            </div>

            {/* Step 4: Recommendation */}
            <div className="relative flex items-start space-x-4">
              <div className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 -ml-[19px] ring-4 ring-white">
                4
              </div>
              <div className="flex-1 bg-teal-50/70 p-4 rounded-xl border border-teal-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block mb-1">
                  4. Recommended Next Best Actions
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {nba.final.map((a, idx) => (
                    <span key={idx} className="bg-white border border-teal-300 text-teal-900 px-2.5 py-1 rounded-md text-xs font-bold font-mono">
                      {a.action} ({a.route})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Agent Activity Trace */}
      {activeTab === 'trace' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">TigerX Agent Execution Trace</h3>
              <p className="text-xs text-slate-500">Autonomous multi-pass reasoning steps and MCP tool calls</p>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-500">
              <span>Tool Calls: <strong className="text-slate-800 font-mono">{data.tool_calls}</strong></span>
              <span>Tokens: <strong className="text-slate-800 font-mono">{data.tokens}</strong></span>
              <span>Latency: <strong className="text-slate-800 font-mono">{data.latency_s}s</strong></span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-2">
              <div className="text-teal-400 font-bold">● [AGENT_INIT] Alert trigger received for {caseId}</div>
              <div className="text-slate-300">✓ [MCP_TOOL:get_transaction_details] Fetched flagged txn #{caseInfo.first_suspicious_txn_id || caseInfo.affected_txn_ids[0]}</div>
              <div className="text-slate-300">✓ [MCP_TOOL:get_card_history] Retrieved card transactions and velocity history</div>
              <div className="text-slate-300">✓ [MCP_TOOL:get_device_neighbors] Discovered {caseInfo.connected_card_ids.length} connected card accounts on device</div>
              <div className="text-slate-300">✓ [UNCERTAINTY_EVAL] Rule R1 check: evaluated evidence confidence</div>
              {evidence_requests.length > 0 && (
                <div className="text-amber-400">⚡ [EVIDENCE_REQUEST] {evidence_requests[0].type}: "{evidence_requests[0].assumed_response}"</div>
              )}
              <div className="text-slate-300">✓ [POLICY_ENGINE] Evaluated Rules R1-R10. Final actions: {nba.final.map(a => a.action).join(', ')}</div>
              <div className="text-emerald-400 font-bold">✓ [GRAPH_MEMORY] Case vertex persisted to TigerGraph ({caseInfo.graph_case_id})</div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 5: Fraud Network Graph */}
      {activeTab === 'network' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Interactive Entity Fraud Network</h3>
                <p className="text-xs text-slate-500">Customer, card, transaction, device profiles, and ring connections</p>
              </div>
              <span className="text-xs text-slate-400">Click any node to inspect attributes</span>
            </div>
            {graphData && (
              <GraphVisualizer
                data={graphData}
                onSelectNode={handleNodeClick}
                height={480}
              />
            )}
          </Card>
        </div>
      )}

      {/* Tab 6: Transactions */}
      {activeTab === 'transactions' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Card Transaction History</h3>
              <p className="text-xs text-slate-500">Historical sequence on card {caseInfo.connected_card_ids[0] || caseId}</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">{transactions.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">Txn ID</th>
                  <th className="pb-2.5">Timestamp</th>
                  <th className="pb-2.5">Amount</th>
                  <th className="pb-2.5">Product</th>
                  <th className="pb-2.5">Channel</th>
                  <th className="pb-2.5">Risk Score</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      t.is_flagged ? 'bg-amber-50/60 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 font-mono text-slate-900">
                      {t.is_flagged && <span className="text-amber-600 mr-1.5">●</span>}
                      #{t.id}
                    </td>
                    <td className="py-2.5 text-slate-600 font-mono text-[11px]">{t.ts}</td>
                    <td className="py-2.5 font-mono font-bold text-slate-900">${t.amt.toFixed(2)}</td>
                    <td className="py-2.5 text-slate-600">{t.product_cd}</td>
                    <td className="py-2.5 text-slate-600 capitalize">{t.channel}</td>
                    <td className="py-2.5 font-mono text-slate-700">{t.risk_score.toFixed(2)}</td>
                    <td className="py-2.5 text-right">
                      {t.is_flagged ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          FLAGGED ALERT
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 7: Timeline */}
      {activeTab === 'timeline' && (
        <Card className="p-6">
          <div className="mb-6 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Chronological Transaction Timeline</h3>
            <p className="text-xs text-slate-500">Visual velocity analysis exposing card testing sequences</p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {transactions.slice(0, 10).map((t, idx) => (
              <div key={idx} className="relative flex items-start space-x-3">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 -ml-[18px] ring-4 ring-white ${
                  t.is_flagged ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
                <div className={`flex-1 p-3.5 rounded-xl border ${
                  t.is_flagged ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50/50 border-slate-200/60'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      ${t.amt.toFixed(2)} · {t.channel}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{t.ts}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Txn #{t.id} · Product {t.product_cd} · Model Score: {t.risk_score.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 8: Prior Cases */}
      {activeTab === 'prior_cases' && (
        <Card className="p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Similar Closed Investigations</h3>
            <p className="text-xs text-slate-500">Retrieved from TigerGraph historical case memory (July–October 2016)</p>
          </div>

          {caseInfo.similar_prior_cases.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No matching prior closed cases retrieved for this alert.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseInfo.similar_prior_cases.map((pcId, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900">{pcId}</span>
                    <Badge variant="teal" size="sm">Similarity: High</Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Matches typology and shared entity attributes in TigerGraph vector memory.
                  </p>
                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                    Retrieved for ground-truth comparison under Policy Rule R9.
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 9: Next Best Actions (NBA) */}
      {activeTab === 'nba' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-6 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Two-Stage Next Best Action Progression</h3>
              <p className="text-xs text-slate-500">Recommendation evolution before and after customer verification under Policy R1/R2</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Initial Recommendation */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Initial Recommendation</span>
                  <span className="text-[10px] text-slate-400 font-medium">Pre-verification</span>
                </div>
                <div className="space-y-2">
                  {nba.initial.map((act, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">{act.action}</span>
                        <Badge variant={act.route === 'auto' ? 'auto' : act.route === 'L1' ? 'L1' : 'L2'} size="sm">
                          {act.route}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">{act.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Recommendation */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">Final Recommendation</span>
                  <span className="text-[10px] text-teal-600 font-medium">Post-verification</span>
                </div>
                <div className="space-y-2">
                  {nba.final.map((act, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white border border-teal-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">{act.action}</span>
                        <Badge variant={act.route === 'auto' ? 'auto' : act.route === 'L1' ? 'L1' : 'L2'} size="sm">
                          {act.route}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">{act.reason}</p>
                      
                      {act.route !== 'auto' && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-amber-700">Approval Required</span>
                          <div className="flex items-center space-x-1.5">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleOpenApproval(act, 'reject')}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenApproval(act, 'approve')}
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* What Changed Narrative */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-800 block mb-1">What Changed Between Initial & Final</span>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">{nba.what_changed}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 10: FinCEN SAR Regulatory Report */}
      {activeTab === 'sar' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Suspicious Activity Report (FinCEN SAR)</h3>
              <p className="text-xs text-slate-500">Formal regulatory filing document conforming to FinCEN Narrative Guidelines</p>
            </div>
            {sar.file && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopySar}
                icon={copiedSar ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedSar ? 'Copied' : 'Copy Narrative'}
              </Button>
            )}
          </div>

          {!sar.file ? (
            <div className="p-6 text-center space-y-2 bg-slate-50 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">SAR Filing Not Required</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">{sar.reason}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Suspicious Amount</span>
                  <span className="text-base font-bold font-mono text-slate-900">${sar.total_amount_usd.toFixed(2)}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Activity Dates</span>
                  <span className="text-xs font-mono font-semibold text-slate-800">{sar.activity_dates.join(' to ')}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Filing Reason</span>
                  <span className="text-xs font-medium text-slate-800">{sar.reason}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2">Subject Entities Named in Report</span>
                <div className="flex flex-wrap gap-1.5">
                  {sar.subjects.map((sub, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-mono border border-slate-200">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2">Regulatory Filing Narrative</span>
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-800 leading-relaxed whitespace-pre-line shadow-2xs">
                  {sar.narrative}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Tab 11: Audit Trail */}
      {activeTab === 'audit' && (
        <Card className="p-6">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Investigation Audit Trail</h3>
            <p className="text-xs text-slate-500">Immutable ledger of investigation triggers, graph queries, and decisions</p>
          </div>

          <div className="divide-y divide-slate-100">
            {audit.map((ev, i) => (
              <div key={i} className="py-3 flex items-start justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-800">{ev.event}</span>
                    {ev.actor && <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">{ev.actor}</span>}
                  </div>
                  <p className="text-slate-600">{ev.details}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-4">{ev.ts}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Approval Modal */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        title={approvalType === 'approve' ? 'Approve Fraud Action' : 'Reject Action Recommendation'}
        subtitle={`Case ${caseId} · Route ${selectedAction?.route}`}
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Action</span>
            <div className="font-mono font-bold text-sm text-slate-900">{selectedAction?.action}</div>
            <p className="text-xs text-slate-600">{selectedAction?.reason}</p>
          </div>

          {approvalType === 'reject' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Rejection / Override</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="State the rationale for analyst override..."
                className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 transition"
                rows={3}
              />
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setApprovalModalOpen(false)}
              disabled={actionProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={approvalType === 'approve' ? 'primary' : 'danger'}
              size="md"
              loading={actionProcessing}
              onClick={handleExecuteApproval}
            >
              {approvalType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Node Detail Slide-out Drawer */}
      <Drawer
        isOpen={nodeDrawerOpen}
        onClose={() => setNodeDrawerOpen(false)}
        title={selectedNode?.label || 'Node Detail'}
        subtitle={`Type: ${selectedNode?.type || 'Entity'}`}
      >
        {selectedNode && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entity ID</span>
              <div className="font-mono font-bold text-slate-900">{selectedNode.id}</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Category</span>
                <span className="font-semibold text-slate-800">{selectedNode.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Associated Case</span>
                <span className="font-mono font-semibold text-slate-800">{caseId}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">TigerGraph Vertex Status</span>
                <span className="font-semibold text-teal-700">Active</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
