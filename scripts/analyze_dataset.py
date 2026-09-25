import csv
import json
from collections import defaultdict, Counter

print("=== 1. CASE PACK ANALYSIS ===")
cases = []
flagged_txns = set()
case_customers = set()
case_cards = set()

with open('data/raw/case_pack.csv', 'r') as f:
    reader = csv.DictReader(f)
    for r in reader:
        cases.append(r)
        flagged_txns.add(r['flagged_txn_id'])
        case_customers.add(r['customer_id'])
        case_cards.add(r['card_id'])

print(f"Total benchmark cases: {len(cases)}")
print(f"Unique customers in benchmark: {len(case_customers)}")
print(f"Unique cards in benchmark: {len(case_cards)}")

print("\n=== 2. MATCHING FLAGGED TRANSACTIONS IN TRANSACTIONS.CSV ===")
flagged_txn_data = {}
customer_all_txns = defaultdict(list)

# Stream transactions.csv
with open('data/raw/transactions.csv', 'r') as f:
    reader = csv.DictReader(f)
    for r in reader:
        tid = r['TransactionID']
        cid = r['customer_id']
        
        if tid in flagged_txns:
            flagged_txn_data[tid] = r
            
        if cid in case_customers:
            # Keep lightweight summary of customer txns
            customer_all_txns[cid].append({
                'tid': tid,
                'ts': r['ts'],
                'amt': float(r['TransactionAmt']),
                'prod': r['ProductCD'],
                'channel': r['channel'],
                'risk': float(r['risk_score']),
                'card1': r['card1'],
                'addr1': r['addr1'],
                'P_email': r['P_emaildomain'],
                'R_email': r['R_emaildomain']
            })

print(f"Found {len(flagged_txn_data)} out of {len(flagged_txns)} flagged transactions.")

print("\n=== 3. CHECKING IDENTITY.CSV FOR FLAGGED AND CUSTOMER TRANSACTIONS ===")
flagged_identities = {}
all_cust_txns_set = set(t['tid'] for txns in customer_all_txns.values() for t in txns)
customer_identities = {}

with open('data/raw/identity.csv', 'r') as f:
    reader = csv.DictReader(f)
    for r in reader:
        tid = r['TransactionID']
        if tid in flagged_txns:
            flagged_identities[tid] = r
        if tid in all_cust_txns_set:
            customer_identities[tid] = r

print(f"Flagged txns with identity records (online): {len(flagged_identities)} / {len(flagged_txns)}")
print(f"Customer txns with identity records: {len(customer_identities)} / {len(all_cust_txns_set)}")

print("\n=== 4. SUMMARY PER BENCHMARK CASE ===")
for c in cases:
    cid = c['case_id']
    tid = c['flagged_txn_id']
    cust = c['customer_id']
    card = c['card_id']
    ttype = c['trigger_type']
    
    t_info = flagged_txn_data.get(tid, {})
    i_info = flagged_identities.get(tid, {})
    
    dev_str = ""
    if i_info:
        dev_str = f"{i_info.get('DeviceInfo','')} | {i_info.get('id_30','')} | {i_info.get('id_31','')} | {i_info.get('id_33','')}"
    
    n_cust_txns = len(customer_all_txns.get(cust, []))
    
    print(f"\n[{cid}] Trigger: {ttype} | Cust: {cust} | Card: {card} | Flagged Txn: {tid}")
    print(f"   Amt: ${t_info.get('TransactionAmt')} | Prod: {t_info.get('ProductCD')} | Channel: {t_info.get('channel')} | Risk: {t_info.get('risk_score')} | Addr1: {t_info.get('addr1')}")
    if dev_str:
        print(f"   Device: {dev_str}")
        print(f"   id_15 (New/Found): {i_info.get('id_15')} | id_23 (Proxy): {i_info.get('id_23')}")
    print(f"   Total txns for customer {cust} in history: {n_cust_txns}")

