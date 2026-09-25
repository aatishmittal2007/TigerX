# HHGOA Fraud Investigation Challenge — Requirements Document

## 1. Challenge Objective
Build an autonomous, evidence-grounded AI fraud investigation system for the Hacker House Goa (HHGOA) Fraud Investigation Challenge (IEEE-CIS edition).
The system must investigate fraud alerts, query graph relationships, evaluate evidence, reason under uncertainty, request additional evidence, recommend next-best actions (NBAs), enforce strict bank policy rules, maintain case memory, and generate audit-grade outputs for 20 benchmark cases (`HHG-001` through `HHG-020`).

---

## 2. Core Constraints & Principles
1. **Evidence Grounding**: LLMs must NEVER hallucinate or guess graph relationships. All facts must be retrieved deterministically from TigerGraph.
2. **Calibration**: ~50% of the cases in the benchmark are legitimate. High risk scores (e.g. 0.90+) can be false alarms (e.g. travel), while low scores can be fraud.
3. **Agentic Loop with Uncertainty**:
   - The agent must assess if it has sufficient evidence.
   - If fraud probability < 0.70 on a single signal (Rule R1), the agent MUST request additional evidence (`VERIFY_WITH_CUSTOMER`, `STEP_UP_AUTH`) before blocking.
   - The agent must demonstrate that its recommendation changes after receiving evidence.
4. **Policy Enforcement vs Reasoning Separation**:
   - Grok proposes recommendations.
   - Deterministic Policy Engine strictly validates whether actions are ALLOWED, REQUIRES_APPROVAL (`L1` or `L2`), or PROHIBITED.

---

## 3. Technology Stack Requirements
- **Reasoning Model**: Grok (xAI API), using structured JSON output.
- **Graph & Vector Database**: TigerGraph Savanna (v4.2+), hosting entities, relationships, graph algorithms, and case memory.
- **Tool / Database Bridge**: TigerGraph MCP (`tigergraph-mcp`).
- **Orchestration**: n8n, coordinating the multi-step agentic loop with loops and conditional branching.
- **Backend**: Python + FastAPI, exposing REST endpoints, hosting the policy engine, and logging audit trails.
- **Frontend**: Financial crime investigation console (cases, graph visualizer, risk gauge, evidence timeline, approval panel).

---

## 4. Fraud Patterns to Identify
1. **`card_testing`**: Rapid sequence of 3+ small authorizations (<$5) within an hour, followed by a larger purchase. Policy: R5.
2. **`card_not_present_fraud`**: Unusual online transactions on card without physical presentation, often in bursts of 2–4 within 48h. Policy: R1–R4.
3. **`card_not_present_new_device`**: Online transaction from a device marked `New` for this account, occasionally with proxy.
4. **`out_of_region_use`**: Card-present transactions in a billing region (`addr1`) where customer has no history, while home activity continues. Several days in one region is travel (trip), not a clone. Policy: R2, R3.
5. **`account_takeover`**: Mixed-channel anomalies, credential usage, device changes inconsistent with cardholder history.
6. **`undocumented`**: Coordinated patterns (e.g. multi-card shared proxy device rings, threshold dodging just under $500). Scored for originality and evidence. Policy: R9.
7. **`none`**: False alarm / legitimate transaction.

---

## 5. Fraud Policy (v1.0) & Actions
### Actions:
- `ALLOW_TRANSACTION`: Let authorization stand (`auto`)
- `DECLINE_TRANSACTION`: Decline flagged transaction only (`L1`)
- `MONITOR_CARD`: Card active; raise monitoring sensitivity for 72h (`auto`)
- `MONITOR_CONNECTED_CARDS`: Place linked cards under monitoring (`auto`)
- `WARN_CUSTOMER`: Informational message or recurring charge reminder (`auto`)
- `VERIFY_WITH_CUSTOMER`: Ask cardholder if they made purchase (`auto`)
- `STEP_UP_AUTH`: Require OTP or biometric confirmation (`auto`)
- `BLOCK_CARD`: Block and reissue (`L1` if exposure <= $2,500; `L2` if > $2,500)
- `BLOCK_ALL_CARDS`: Block all customer cards (`L2` always; requires R10 proof)
- `GENERATE_REPORT`: Internal report without opening case (`auto`)
- `CREATE_CASE`: Open internal fraud case and write to graph (`auto`)
- `FILE_REPORT`: File regulatory Suspicious Activity Report (`L2` always)
- `ESCALATE_TO_ANALYST`: Hand over to human analyst (`auto`)
- `CLOSE_NO_FRAUD`: Close alert as legitimate (`auto`)

### Rules:
- **R1**: Single signal & prob < 0.70 -> Verify before blocking (`VERIFY_WITH_CUSTOMER` or `STEP_UP_AUTH`).
- **R2**: Customer denies -> `BLOCK_CARD` and `CREATE_CASE`. File SAR if exposure > $1,000 or shared device/card link.
- **R3**: Customer confirms -> `CLOSE_NO_FRAUD`.
- **R4**: No reply in 24h -> `MONITOR_CARD` and `DECLINE_TRANSACTION`. Escalate if exposure > $500.
- **R5**: Card testing -> `DECLINE_TRANSACTION` and `STEP_UP_AUTH`. Block if purchase > $100 cleared.
- **R6**: Shared origin -> Multi-card links require `CREATE_CASE`, `FILE_REPORT`, and `MONITOR_CONNECTED_CARDS`.
- **R7**: Disputed recurring charge -> `CREATE_CASE`, `VERIFY_WITH_CUSTOMER`, `WARN_CUSTOMER`. Do not block.
- **R8**: Uncertain verdict & exposure > $500 -> `ESCALATE_TO_ANALYST`.
- **R9**: Undocumented pattern -> `CREATE_CASE`, `FILE_REPORT`, `ESCALATE_TO_ANALYST`, describe typology.
- **R10**: Never `BLOCK_ALL_CARDS` unless 2+ cards compromised or credentials confirmed stolen.

---

## 6. Deliverable Format (Per Benchmark Case)
Output 20 JSON files named `<case_id>.json` in `cases/` containing:
1. `case`: Internal investigation record (verdict, fraud_probability, pattern, affected_txn_ids, connected_cards, connected_devices, exposure_usd, evidence list, similar_prior_cases, summary, written_to_graph).
2. `evidence_requests`: Simulated interactions (`customer_validation`, `step_up_auth`, `analyst_info`) with assumed responses.
3. `next_best_actions`: Both `initial` (pre-evidence) and `final` (post-evidence) with exact action names, approval routes, and cited rules.
4. `sar`: Standalone FinCEN narrative (*who, what, when, where, how, why*), subjects, total amount, dates if `FILE_REPORT` is recommended.
5. Metrics: `stop_reason`, `tool_calls`, `tokens`, `latency_s`.
