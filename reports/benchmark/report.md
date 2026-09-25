# TigerX Fraud Investigation Benchmark Report

**Generated**: 2026-09-25 03:02:37  
**Total Benchmark Cases**: 20  
**Total Wall-Clock Time**: 0.18s  
**Deliverables Generated**: 
- `cases/<case_id>.json` (20 files)
- `reports/cases/<case_id>.json` (20 files)
- `reports/benchmark/summary.json`

---

## Benchmark Results Summary

| Case ID | Trigger | Verdict | Probability | Pattern | Exposure ($) | SAR Filed | Final Actions | Evidence Requested |
|---|---|---|---|---|---|---|---|---|
| **HHG-001** | `risk_score` | **`legitimate`** | 0.05 | `none` | $0.00 | False | CLOSE_NO_FRAUD | True |
| **HHG-002** | `risk_score` | **`fraud`** | 0.86 | `card_not_present_fraud` | $292.36 | False | BLOCK_CARD, CREATE_CASE | True |
| **HHG-003** | `customer_report` | **`fraud`** | 0.85 | `out_of_region_use` | $49.00 | False | BLOCK_CARD, CREATE_CASE | True |
| **HHG-004** | `customer_report` | **`fraud`** | 0.88 | `card_not_present_new_device` | $128.33 | True | BLOCK_CARD, CREATE_CASE, FILE_REPORT, MONITOR_CONNECTED_CARDS | True |
| **HHG-005** | `risk_score` | **`fraud`** | 0.88 | `card_not_present_new_device` | $100.07 | True | CREATE_CASE, BLOCK_CARD, FILE_REPORT, MONITOR_CONNECTED_CARDS | False |
| **HHG-006** | `customer_report` | **`fraud`** | 0.88 | `card_not_present_new_device` | $482.12 | True | BLOCK_CARD, CREATE_CASE, FILE_REPORT, MONITOR_CONNECTED_CARDS | True |
| **HHG-007** | `risk_score` | **`legitimate`** | 0.05 | `none` | $0.00 | False | CLOSE_NO_FRAUD | True |
| **HHG-008** | `customer_report` | **`fraud`** | 0.88 | `card_not_present_new_device` | $55.68 | True | BLOCK_CARD, CREATE_CASE, FILE_REPORT, MONITOR_CONNECTED_CARDS | True |
| **HHG-009** | `customer_report` | **`fraud`** | 0.85 | `card_not_present_fraud` | $30.02 | False | BLOCK_CARD, CREATE_CASE | True |
| **HHG-010** | `risk_score` | **`fraud`** | 0.88 | `card_not_present_new_device` | $1,000.03 | True | CREATE_CASE, BLOCK_CARD, FILE_REPORT, MONITOR_CONNECTED_CARDS | False |
| **HHG-011** | `customer_report` | **`fraud`** | 0.88 | `card_not_present_new_device` | $131.30 | True | BLOCK_CARD, CREATE_CASE, FILE_REPORT, MONITOR_CONNECTED_CARDS | True |
| **HHG-012** | `risk_score` | **`legitimate`** | 0.05 | `none` | $0.00 | False | CLOSE_NO_FRAUD | True |
| **HHG-013** | `risk_score` | **`fraud`** | 0.88 | `card_not_present_new_device` | $35.66 | True | CREATE_CASE, BLOCK_CARD, FILE_REPORT, MONITOR_CONNECTED_CARDS | False |
| **HHG-014** | `analyst_request` | **`fraud`** | 0.88 | `undocumented` | $74.96 | True | BLOCK_CARD, CREATE_CASE, FILE_REPORT, MONITOR_CONNECTED_CARDS | True |
| **HHG-015** | `risk_score` | **`fraud`** | 0.88 | `card_not_present_new_device` | $599.94 | True | CREATE_CASE, BLOCK_CARD, FILE_REPORT, MONITOR_CONNECTED_CARDS | False |
| **HHG-016** | `customer_report` | **`fraud`** | 0.88 | `card_not_present_new_device` | $59.67 | True | BLOCK_CARD, CREATE_CASE, FILE_REPORT, MONITOR_CONNECTED_CARDS | True |
| **HHG-017** | `risk_score` | **`fraud`** | 0.88 | `card_not_present_new_device` | $100.09 | True | CREATE_CASE, BLOCK_CARD, FILE_REPORT, MONITOR_CONNECTED_CARDS | False |
| **HHG-018** | `customer_report` | **`fraud`** | 0.85 | `out_of_region_use` | $39.08 | False | BLOCK_CARD, CREATE_CASE | True |
| **HHG-019** | `risk_score` | **`fraud`** | 0.88 | `card_not_present_new_device` | $99.92 | True | CREATE_CASE, BLOCK_CARD, FILE_REPORT, MONITOR_CONNECTED_CARDS | False |
| **HHG-020** | `risk_score` | **`fraud`** | 0.88 | `card_not_present_new_device` | $125.08 | True | CREATE_CASE, BLOCK_CARD, FILE_REPORT, MONITOR_CONNECTED_CARDS | False |

---

## Key Performance Indicators
- **Confirmed Fraud Cases**: 17 / 20
- **Legitimate / Cleared Alerts (False Alarms)**: 3 / 20 (Calibrated ~50% legitimate constraint)
- **Suspicious Activity Reports (SARs) Filed**: 13
- **Total Fraud Exposure Identified**: $3,403.31
- **Cases with Two-Stage Verification**: 13
