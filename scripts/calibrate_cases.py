import csv
from tigergraph.tigergraph_service import fraud_graph_service

with open('data/raw/case_pack.csv') as f:
    cases = list(csv.DictReader(f))

print(f"{'Case':<8} | {'Trigger':<16} | {'Risk':<5} | {'Txn':<8} | {'Amt ($)':<8} | {'Chan':<7} | {'Dev Status':<10} | {'Region Match':<15}")
print("-" * 90)

for c in cases:
    cid = c['case_id']
    tid = c['flagged_txn_id']
    cust = c['customer_id']
    card = c['card_id']
    ttype = c['trigger_type']
    score = c['risk_score'] or 'N/A'
    
    txn = fraud_graph_service.get_transaction_details(tid) or {}
    amt = txn.get('amt', 0.0)
    chan = txn.get('channel', '')
    
    dev_prof = txn.get('device_profile', {})
    is_new = dev_prof.get('is_new', 'N/A')
    
    # Check region
    regions = fraud_graph_service.get_customer_regions(cust)
    # Check addr1 for flagged txn
    # (let's check addr1 from transactions.csv)
    
    print(f"{cid:<8} | {ttype:<16} | {score:<5} | {tid:<8} | {amt:<8.2f} | {chan:<7} | {is_new:<10} | Prior Regions: {len(regions)}")

