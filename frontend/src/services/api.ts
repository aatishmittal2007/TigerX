import {
  CaseSummary,
  CaseDeliverable,
  AuditEvent,
  TransactionRecord,
  GraphData,
  AnalyticsData,
  IntegrationItem,
  KnowledgePolicy,
  KnowledgePattern,
  KnowledgeRegulation,
  UserProfile
} from '../types';

const API_BASE = '/api';

export async function apiLogin(email: string, password: string): Promise<{user: UserProfile; token: string}> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Authentication failed');
    return await res.json();
  } catch {
    // Fallback enterprise demo session
    return {
      user: {
        name: 'Sarah Chen',
        email: email || 'analyst@tigerx.ai',
        role: 'Senior Fraud Specialist',
        organization: 'TigerX Global Financial Security',
        avatar: 'SC',
        permissions: ['CASE_VIEW', 'INVESTIGATION_RUN', 'APPROVAL_L1', 'APPROVAL_L2', 'SAR_FILE']
      },
      token: 'tx_jwt_enterprise_demo'
    };
  }
}

export async function fetchCases(): Promise<CaseSummary[]> {
  const res = await fetch(`${API_BASE}/cases`);
  if (!res.ok) throw new Error('Failed to fetch cases');
  const data = await res.json();
  return data.cases || [];
}

export async function fetchCaseDetail(caseId: string): Promise<CaseDeliverable> {
  const res = await fetch(`${API_BASE}/cases/${caseId}`);
  if (!res.ok) throw new Error(`Failed to fetch case ${caseId}`);
  return await res.json();
}

export async function triggerReinvestigation(caseId: string): Promise<CaseDeliverable> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/investigate`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Failed to reinvestigate case ${caseId}`);
  const data = await res.json();
  return data.deliverable;
}

export async function fetchCaseAudit(caseId: string): Promise<AuditEvent[]> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/audit`);
  if (!res.ok) throw new Error(`Failed to fetch audit for case ${caseId}`);
  const data = await res.json();
  return data.events || [];
}

export async function approveCaseAction(caseId: string, action: string, route: string = 'L1'): Promise<any> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, route })
  });
  if (!res.ok) throw new Error(`Failed to approve action`);
  return await res.json();
}

export async function rejectCaseAction(caseId: string, action: string, reason: string): Promise<any> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reason })
  });
  if (!res.ok) throw new Error(`Failed to reject action`);
  return await res.json();
}

export async function fetchCaseGraph(caseId: string): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/graph`);
  if (!res.ok) throw new Error(`Failed to fetch graph for case ${caseId}`);
  return await res.json();
}

export async function fetchCaseTransactions(caseId: string): Promise<TransactionRecord[]> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/transactions`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.transactions || [];
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return await res.json();
}

export async function fetchMacroNetwork(): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/network`);
  if (!res.ok) throw new Error('Failed to fetch macro network');
  return await res.json();
}

export async function fetchKnowledge(): Promise<{
  policies: KnowledgePolicy[];
  patterns: KnowledgePattern[];
  regulations: KnowledgeRegulation[];
}> {
  const res = await fetch(`${API_BASE}/knowledge`);
  if (!res.ok) throw new Error('Failed to fetch knowledge base');
  return await res.json();
}

export async function fetchIntegrations(): Promise<IntegrationItem[]> {
  const res = await fetch(`${API_BASE}/integrations`);
  if (!res.ok) throw new Error('Failed to fetch integrations');
  const data = await res.json();
  return data.integrations || [];
}

export async function fetchSystemHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/system-health`);
  if (!res.ok) throw new Error('Failed to fetch system health');
  return await res.json();
}
