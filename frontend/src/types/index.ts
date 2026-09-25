export interface CaseSummary {
  case_id: string;
  trigger_type: string;
  trigger_text: string;
  flagged_txn_id: string;
  customer_id: string;
  card_id: string;
  risk_score: number | null;
  status: 'open' | 'closed_fraud' | 'closed_legitimate' | 'escalated';
  verdict: 'fraud' | 'legitimate' | 'uncertain';
  fraud_probability: number;
  pattern: string;
  exposure_usd: number;
  sar_filed: boolean;
  final_actions: string[];
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface EvidenceItem {
  claim: string;
  source: 'graph' | 'document' | 'customer' | 'external';
  ref: string;
  entity_ids: string[];
}

export interface PriorCase {
  id: string;
  outcome?: string;
  pattern?: string;
  exposure_usd?: number;
  notes?: string;
  similarity?: string;
}

export interface ActionItem {
  action: string;
  route: 'auto' | 'L1' | 'L2';
  reason: string;
}

export interface CaseDetail {
  status: 'open' | 'closed_fraud' | 'closed_legitimate' | 'escalated';
  verdict: 'fraud' | 'legitimate' | 'uncertain';
  fraud_probability: number;
  pattern: string;
  pattern_description: string;
  affected_txn_ids: string[];
  first_suspicious_txn_id: string;
  connected_card_ids: string[];
  connected_device_profiles: string[];
  exposure_usd: number;
  evidence: EvidenceItem[];
  similar_prior_cases: string[];
  summary: string;
  written_to_graph: boolean;
  graph_case_id: string;
}

export interface SarData {
  file: boolean;
  reason: string;
  narrative: string;
  subjects: string[];
  total_amount_usd: number;
  activity_dates: string[];
}

export interface CaseDeliverable {
  case_id: string;
  case: CaseDetail;
  evidence_requests: Array<{
    type: string;
    asked_after_step: number;
    assumed_response: string;
  }>;
  next_best_actions: {
    initial: ActionItem[];
    final: ActionItem[];
    what_changed: string;
  };
  sar: SarData;
  stop_reason: string;
  tool_calls: number;
  tokens: number;
  latency_s: number;
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface AuditEvent {
  ts: string;
  event: string;
  details: string;
  actor?: string;
}

export interface TransactionRecord {
  id: string;
  ts: string;
  amt: number;
  product_cd: string;
  channel: string;
  risk_score: number;
  card_id: string;
  is_flagged?: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  color?: string;
  size?: number;
  verdict?: string;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label?: string;
  type?: string;
}

export interface GraphData {
  case_id?: string;
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface AnalyticsData {
  total_cases: number;
  verdict_breakdown: {
    fraud: number;
    legitimate: number;
    uncertain: number;
  };
  pattern_distribution: Record<string, number>;
  exposure_by_pattern: Record<string, number>;
  total_exposure_usd: number;
  sar_filing_rate: number;
  sar_count: number;
  risk_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  average_investigation_time_s: number;
  false_alarm_rate: number;
}

export interface IntegrationItem {
  name: string;
  category: string;
  status: string;
  endpoint: string;
  latency_ms: number;
  version: string;
  details: string;
}

export interface KnowledgePolicy {
  id: string;
  title: string;
  summary: string;
}

export interface KnowledgePattern {
  name: string;
  label: string;
  desc: string;
}

export interface KnowledgeRegulation {
  authority: string;
  title: string;
  url: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  organization: string;
  avatar: string;
  permissions: string[];
}
