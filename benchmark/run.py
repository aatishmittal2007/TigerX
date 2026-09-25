"""
TigerX Benchmark Evaluation Runner
Executes all 20 benchmark cases (HHG-001 to HHG-020),
generates compliant JSON deliverables in cases/ and reports/cases/,
and produces reports/benchmark/summary.json and reports/benchmark/report.md.
"""

import os
import sys
import csv
import json
import time
from datetime import datetime
from agent.grok_agent import grok_agent

def run_benchmark():
    os.makedirs('cases', exist_ok=True)
    os.makedirs('reports/cases', exist_ok=True)
    os.makedirs('reports/benchmark', exist_ok=True)
    
    cases_pack_file = 'data/raw/case_pack.csv'
    if not os.path.exists(cases_pack_file):
        print(f"Error: {cases_pack_file} not found.")
        sys.exit(1)
        
    with open(cases_pack_file, 'r', encoding='utf-8') as f:
        cases = list(csv.DictReader(f))
        
    print(f"============================================================")
    print(f"  TIGERX BENCHMARK EVALUATION: {len(cases)} CASES")
    print(f"============================================================\n")
    
    results = []
    start_total = time.time()
    
    for i, c in enumerate(cases, 1):
        cid = c['case_id']
        print(f"[{i:02d}/{len(cases):02d}] Investigating {cid} (Trigger: {c['trigger_type']})...", end="", flush=True)
        
        answer = grok_agent.investigate(c)
        
        # Save to cases/<case_id>.json
        out_path1 = f"cases/{cid}.json"
        with open(out_path1, 'w', encoding='utf-8') as out_f1:
            json.dump(answer, out_f1, indent=2)
            
        # Mirror to reports/cases/<case_id>.json
        out_path2 = f"reports/cases/{cid}.json"
        with open(out_path2, 'w', encoding='utf-8') as out_f2:
            json.dump(answer, out_f2, indent=2)
            
        case_info = answer['case']
        sar_info = answer['sar']
        nba_info = answer['next_best_actions']
        
        results.append({
            'case_id': cid,
            'trigger_type': c['trigger_type'],
            'verdict': case_info['verdict'],
            'fraud_prob': case_info['fraud_probability'],
            'pattern': case_info['pattern'],
            'exposure': case_info['exposure_usd'],
            'sar_filed': sar_info['file'],
            'initial_actions': [a['action'] for a in nba_info['initial']],
            'final_actions': [a['action'] for a in nba_info['final']],
            'evidence_requested': len(answer['evidence_requests']) > 0,
            'tool_calls': answer['tool_calls'],
            'latency_s': answer['latency_s']
        })
        print(f" Verdict: {case_info['verdict'].upper()} (Prob: {case_info['fraud_probability']:.2f}) | SAR: {sar_info['file']} | Time: {answer['latency_s']}s")

    total_time = round(time.time() - start_total, 2)
    
    # 1. Generate summary.json
    summary_data = {
        "benchmark_name": "TigerX HHGOA Fraud Investigation Benchmark",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "total_cases": len(cases),
        "total_time_seconds": total_time,
        "cases_directory": "cases/",
        "reports_cases_directory": "reports/cases/",
        "metrics": {
            "fraud_count": sum(1 for r in results if r['verdict'] == 'fraud'),
            "legitimate_count": sum(1 for r in results if r['verdict'] == 'legitimate'),
            "uncertain_count": sum(1 for r in results if r['verdict'] == 'uncertain'),
            "sar_filed_count": sum(1 for r in results if r['sar_filed']),
            "total_exposure_usd": round(sum(r['exposure'] for r in results), 2),
            "evidence_requested_cases": sum(1 for r in results if r['evidence_requested'])
        },
        "results": results
    }
    
    with open('reports/benchmark/summary.json', 'w', encoding='utf-8') as sum_f:
        json.dump(summary_data, sum_f, indent=2)
        
    # 2. Generate report.md
    md_report = f"""# TigerX Fraud Investigation Benchmark Report

**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**Total Benchmark Cases**: {len(cases)}  
**Total Wall-Clock Time**: {total_time}s  
**Deliverables Generated**: 
- `cases/<case_id>.json` (20 files)
- `reports/cases/<case_id>.json` (20 files)
- `reports/benchmark/summary.json`

---

## Benchmark Results Summary

| Case ID | Trigger | Verdict | Probability | Pattern | Exposure ($) | SAR Filed | Final Actions | Evidence Requested |
|---|---|---|---|---|---|---|---|---|
"""
    for r in results:
        actions_str = ", ".join(r['final_actions'])
        md_report += f"| **{r['case_id']}** | `{r['trigger_type']}` | **`{r['verdict']}`** | {r['fraud_prob']:.2f} | `{r['pattern']}` | ${r['exposure']:,.2f} | {r['sar_filed']} | {actions_str} | {r['evidence_requested']} |\n"

    md_report += f"""
---

## Key Performance Indicators
- **Confirmed Fraud Cases**: {summary_data['metrics']['fraud_count']} / {len(cases)}
- **Legitimate / Cleared Alerts (False Alarms)**: {summary_data['metrics']['legitimate_count']} / {len(cases)} (Calibrated ~50% legitimate constraint)
- **Suspicious Activity Reports (SARs) Filed**: {summary_data['metrics']['sar_filed_count']}
- **Total Fraud Exposure Identified**: ${summary_data['metrics']['total_exposure_usd']:,.2f}
- **Cases with Two-Stage Verification**: {summary_data['metrics']['evidence_requested_cases']}
"""

    with open('reports/benchmark/report.md', 'w', encoding='utf-8') as rep_f:
        rep_f.write(md_report)
        
    print(f"\n============================================================")
    print(f"  BENCHMARK COMPLETE ({total_time}s)")
    print(f"  - 20 JSON deliverables in cases/ and reports/cases/")
    print(f"  - reports/benchmark/summary.json written")
    print(f"  - reports/benchmark/report.md written")
    print(f"============================================================\n")

if __name__ == '__main__':
    run_benchmark()
