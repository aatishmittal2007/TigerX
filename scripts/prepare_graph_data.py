import csv
import os
import sys

print("=== Starting Graph Data Ingestion Preparation ===")

os.makedirs('data/processed', exist_ok=True)

# 1. First, build card_id mapping from closed cases and case pack
print("Step 1: Building card signature mapping...")
known_card_mapping = {}

with open('data/raw/closed_cases_history.csv', 'r') as f:
    for r in csv.DictReader(f):
        cid = r['card_id']
        cust = r['customer_id']
        tids = r['txn_ids'].split('|')
        for t in tids:
            if t:
                known_card_mapping[t] = (cust, cid)

with open('data/raw/case_pack.csv', 'r') as f:
    for r in csv.DictReader(f):
        known_card_mapping[r['flagged_txn_id']] = (r['customer_id'], r['card_id'])

# Map (cust, card1..card6) to card_id
card_sig_to_id = {}
with open('data/raw/transactions.csv', 'r') as f:
    for r in csv.DictReader(f):
        tid = r['TransactionID']
        if tid in known_card_mapping:
            cust, cid = known_card_mapping[tid]
            sig = (cust, r['card1'], r['card2'], r['card3'], r['card4'], r['card5'], r['card6'])
            card_sig_to_id[sig] = cid

print(f"Known card signatures established: {len(card_sig_to_id)}")

# Customer to sequential card counter for unseen cards
cust_card_counters = {}
for sig, cid in card_sig_to_id.items():
    cust = sig[0]
    try:
        k_num = int(cid.split('-K')[-1])
        cust_card_counters[cust] = max(cust_card_counters.get(cust, 0), k_num)
    except:
        pass

def get_card_id(cust, c1, c2, c3, c4, c5, c6):
    sig = (cust, c1, c2, c3, c4, c5, c6)
    if sig in card_sig_to_id:
        return card_sig_to_id[sig]
    # Allocate next card ID for customer
    next_k = cust_card_counters.get(cust, 0) + 1
    cust_card_counters[cust] = next_k
    cid = f"{cust}-K{next_k}"
    card_sig_to_id[sig] = cid
    return cid

# 2. Process identity.csv into memory lookup
print("Step 2: Indexing identity.csv...")
identities = {}
with open('data/raw/identity.csv', 'r') as f:
    for r in csv.DictReader(f):
        tid = r['TransactionID']
        dev_info = (r.get('DeviceInfo') or '').strip()
        os_name = (r.get('id_30') or '').strip()
        browser = (r.get('id_31') or '').strip()
        screen = (r.get('id_33') or '').strip()
        
        # Build composite device profile ID
        if dev_info or os_name or browser or screen:
            dev_id = f"{dev_info} | {os_name} | {browser} | {screen}"
        else:
            dev_id = ""
            
        identities[tid] = {
            'dev_id': dev_id,
            'dev_info': dev_info,
            'os_name': os_name,
            'browser': browser,
            'screen': screen,
            'is_new': (r.get('id_15') or '').strip(),
            'proxy': (r.get('id_23') or '').strip()
        }

print(f"Identity records indexed: {len(identities)}")

# 3. Stream transactions and write vertices & edges
print("Step 3: Processing transactions and writing graph files...")

f_cust = open('data/processed/vertices_customer.csv', 'w', newline='')
w_cust = csv.writer(f_cust)
w_cust.writerow(['id'])

f_card = open('data/processed/vertices_card.csv', 'w', newline='')
w_card = csv.writer(f_card)
w_card.writerow(['id', 'network', 'card_type'])

f_txn = open('data/processed/vertices_transaction.csv', 'w', newline='')
w_txn = csv.writer(f_txn)
w_txn.writerow(['id', 'ts', 'amt', 'product_cd', 'channel', 'risk_score'])

f_dev = open('data/processed/vertices_device_profile.csv', 'w', newline='')
w_dev = csv.writer(f_dev)
w_dev.writerow(['id', 'device_info', 'os_name', 'browser', 'screen', 'is_new', 'proxy_type'])

f_email = open('data/processed/vertices_email_domain.csv', 'w', newline='')
w_email = csv.writer(f_email)
w_email.writerow(['id'])

f_region = open('data/processed/vertices_billing_region.csv', 'w', newline='')
w_region = csv.writer(f_region)
w_region.writerow(['id'])

f_e_owns = open('data/processed/edges_owns.csv', 'w', newline='')
w_e_owns = csv.writer(f_e_owns)
w_e_owns.writerow(['customer_id', 'card_id'])

f_e_made = open('data/processed/edges_made.csv', 'w', newline='')
w_e_made = csv.writer(f_e_made)
w_e_made.writerow(['card_id', 'transaction_id'])

f_e_dev = open('data/processed/edges_from_device.csv', 'w', newline='')
w_e_dev = csv.writer(f_e_dev)
w_e_dev.writerow(['transaction_id', 'device_profile_id'])

f_e_used_dev = open('data/processed/edges_used_device.csv', 'w', newline='')
w_e_used_dev = csv.writer(f_e_used_dev)
w_e_used_dev.writerow(['card_id', 'device_profile_id'])

f_e_email = open('data/processed/edges_purchaser_email.csv', 'w', newline='')
w_e_email = csv.writer(f_e_email)
w_e_email.writerow(['transaction_id', 'email_domain'])

f_e_region = open('data/processed/edges_billed_in.csv', 'w', newline='')
w_e_region = csv.writer(f_e_region)
w_e_region.writerow(['transaction_id', 'billing_region'])

seen_customers = set()
seen_cards = set()
seen_devices = set()
seen_emails = set()
seen_regions = set()
seen_owns = set()
seen_used_dev = set()

count_txns = 0

with open('data/raw/transactions.csv', 'r') as f:
    for r in csv.DictReader(f):
        tid = r['TransactionID']
        cust = r['customer_id']
        ts = r['ts']
        amt = r['TransactionAmt']
        prod = r['ProductCD']
        chan = r['channel']
        risk = r['risk_score']
        
        card_id = get_card_id(cust, r['card1'], r['card2'], r['card3'], r['card4'], r['card5'], r['card6'])
        network = r['card4']
        card_type = r['card6']
        
        # Customers
        if cust and cust not in seen_customers:
            seen_customers.add(cust)
            w_cust.writerow([cust])
            
        # Cards
        if card_id not in seen_cards:
            seen_cards.add(card_id)
            w_card.writerow([card_id, network, card_type])
            
        # OWNS edge
        if (cust, card_id) not in seen_owns:
            seen_owns.add((cust, card_id))
            w_e_owns.writerow([cust, card_id])
            
        # Transactions
        w_txn.writerow([tid, ts, amt, prod, chan, risk])
        
        # MADE edge
        w_e_made.writerow([card_id, tid])
        
        # Devices
        if tid in identities:
            dev = identities[tid]
            dev_id = dev['dev_id']
            if dev_id:
                if dev_id not in seen_devices:
                    seen_devices.add(dev_id)
                    w_dev.writerow([dev_id, dev['dev_info'], dev['os_name'], dev['browser'], dev['screen'], dev['is_new'], dev['proxy']])
                w_e_dev.writerow([tid, dev_id])
                
                if (card_id, dev_id) not in seen_used_dev:
                    seen_used_dev.add((card_id, dev_id))
                    w_e_used_dev.writerow([card_id, dev_id])
                    
        # Email domains
        email = (r.get('P_emaildomain') or '').strip()
        if email:
            if email not in seen_emails:
                seen_emails.add(email)
                w_email.writerow([email])
            w_e_email.writerow([tid, email])
            
        # Billing regions
        addr1 = (r.get('addr1') or '').strip()
        if addr1:
            if addr1 not in seen_regions:
                seen_regions.add(addr1)
                w_region.writerow([addr1])
            w_e_region.writerow([tid, addr1])
            
        count_txns += 1
        if count_txns % 100000 == 0:
            print(f"Processed {count_txns} transactions...")

# Close all transaction-related files
f_cust.close()
f_card.close()
f_txn.close()
f_dev.close()
f_email.close()
f_region.close()
f_e_owns.close()
f_e_made.close()
f_e_dev.close()
f_e_used_dev.close()
f_e_email.close()
f_e_region.close()

print(f"Total transactions written: {count_txns}")
print(f"Unique Customers: {len(seen_customers)}")
print(f"Unique Cards: {len(seen_cards)}")
print(f"Unique DeviceProfiles: {len(seen_devices)}")
print(f"Unique Email Domains: {len(seen_emails)}")
print(f"Unique Billing Regions: {len(seen_regions)}")

# 4. Process closed cases
print("Step 4: Processing closed cases...")
f_cc = open('data/processed/vertices_closed_case.csv', 'w', newline='')
w_cc = csv.writer(f_cc)
w_cc.writerow(['id', 'outcome', 'pattern', 'exposure_usd', 'report_filed', 'analyst_notes', 'opened_at', 'closed_at'])

f_e_cc_inv = open('data/processed/edges_closed_case_involves.csv', 'w', newline='')
w_e_cc_inv = csv.writer(f_e_cc_inv)
w_e_cc_inv.writerow(['case_id', 'transaction_id'])

f_e_cc_card = open('data/processed/edges_closed_case_on_card.csv', 'w', newline='')
w_e_cc_card = csv.writer(f_e_cc_card)
w_e_cc_card.writerow(['case_id', 'card_id'])

f_e_cc_conn = open('data/processed/edges_closed_case_connected_card.csv', 'w', newline='')
w_e_cc_conn = csv.writer(f_e_cc_conn)
w_e_cc_conn.writerow(['case_id', 'card_id'])

with open('data/raw/closed_cases_history.csv', 'r') as f:
    for r in csv.DictReader(f):
        cid = r['case_id']
        outcome = r['outcome']
        pattern = r['pattern']
        exposure = r['exposure_usd']
        report = r['report_filed']
        notes = r['analyst_notes']
        opened = r['opened_at']
        closed = r['closed_at']
        card_id = r['card_id']
        
        w_cc.writerow([cid, outcome, pattern, exposure, report, notes, opened, closed])
        
        if card_id:
            w_e_cc_card.writerow([cid, card_id])
            
        tids = r['txn_ids'].split('|')
        for t in tids:
            if t:
                w_e_cc_inv.writerow([cid, t])
                
        conn_cards = r['connected_card_ids'].split('|') if r.get('connected_card_ids') else []
        for cc in conn_cards:
            if cc:
                w_e_cc_conn.writerow([cid, cc])

f_cc.close()
f_e_cc_inv.close()
f_e_cc_card.close()
f_e_cc_conn.close()

print("=== Graph Data Ingestion Preparation Complete! ===")
