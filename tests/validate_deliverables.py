import os
import json

REQUIRED_TOP_KEYS = {"case_id", "case", "evidence_requests", "next_best_actions", "sar", "stop_reason", "tool_calls", "tokens", "latency_s"}
REQUIRED_CASE_KEYS = {"status", "verdict", "fraud_probability", "pattern", "pattern_description", "affected_txn_ids", "first_suspicious_txn_id", "connected_card_ids", "connected_device_profiles", "exposure_usd", "evidence", "similar_prior_cases", "summary", "written_to_graph", "graph_case_id"}
REQUIRED_SAR_KEYS = {"file", "reason", "narrative", "subjects", "total_amount_usd", "activity_dates"}
REQUIRED_NBA_KEYS = {"initial", "final", "what_changed"}

VALID_ACTIONS = {
    "ALLOW_TRANSACTION", "DECLINE_TRANSACTION", "MONITOR_CARD", "MONITOR_CONNECTED_CARDS",
    "WARN_CUSTOMER", "VERIFY_WITH_CUSTOMER", "STEP_UP_AUTH", "BLOCK_CARD", "BLOCK_ALL_CARDS",
    "GENERATE_REPORT", "CREATE_CASE", "FILE_REPORT", "ESCALATE_TO_ANALYST", "CLOSE_NO_FRAUD"
}

VALID_PATTERNS = {
    "card_testing", "card_not_present_fraud", "card_not_present_new_device",
    "out_of_region_use", "account_takeover", "undocumented", "none"
}

errors = []
print("Validating all 20 deliverable files in cases/...")

for i in range(1, 21):
    cid = f"HHG-{i:03d}"
    fpath = f"cases/{cid}.json"
    if not os.path.exists(fpath):
        errors.append(f"Missing file: {fpath}")
        continue
        
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # Check top keys
    missing_top = REQUIRED_TOP_KEYS - set(data.keys())
    if missing_top:
        errors.append(f"{cid}: Missing top keys: {missing_top}")
        
    # Check case keys
    c = data.get("case", {})
    missing_c = REQUIRED_CASE_KEYS - set(c.keys())
    if missing_c:
        errors.append(f"{cid}: Missing case keys: {missing_c}")
        
    # Check pattern
    if c.get("pattern") not in VALID_PATTERNS:
        errors.append(f"{cid}: Invalid pattern: {c.get('pattern')}")
        
    if c.get("pattern") == "undocumented" and not c.get("pattern_description"):
        errors.append(f"{cid}: pattern_description required for undocumented pattern")
        
    # Check SAR keys
    s = data.get("sar", {})
    missing_s = REQUIRED_SAR_KEYS - set(s.keys())
    if missing_s:
        errors.append(f"{cid}: Missing sar keys: {missing_s}")
        
    # Check NBA keys
    n = data.get("next_best_actions", {})
    missing_n = REQUIRED_NBA_KEYS - set(n.keys())
    if missing_n:
        errors.append(f"{cid}: Missing NBA keys: {missing_n}")
        
    for act in n.get("initial", []) + n.get("final", []):
        if act.get("action") not in VALID_ACTIONS:
            errors.append(f"{cid}: Invalid action name: {act.get('action')}")
        if act.get("route") not in ["auto", "L1", "L2"]:
            errors.append(f"{cid}: Invalid approval route: {act.get('route')}")

    # Check legitimate rules
    if c.get("verdict") == "legitimate":
        if c.get("affected_txn_ids") != []:
            errors.append(f"{cid}: Legitimate verdict must have empty affected_txn_ids")
        if c.get("exposure_usd") != 0.0:
            errors.append(f"{cid}: Legitimate verdict must have 0.0 exposure_usd")
        if s.get("file") is not False:
            errors.append(f"{cid}: Legitimate verdict must have sar.file=false")

    # Check SAR narrative if file is true
    if s.get("file") is True:
        if not s.get("narrative"):
            errors.append(f"{cid}: SAR file is true but narrative is empty")
        if not s.get("subjects"):
            errors.append(f"{cid}: SAR file is true but subjects list is empty")
        if not s.get("activity_dates"):
            errors.append(f"{cid}: SAR file is true but activity_dates is empty")

if errors:
    print(f"FAILED with {len(errors)} error(s):")
    for e in errors:
        print(" -", e)
    exit(1)
else:
    print("SUCCESS! All 20 deliverable files passed 100% of strict challenge schema validations!")

