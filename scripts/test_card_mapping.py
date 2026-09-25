import csv
from collections import defaultdict

# 1. Collect all known (customer_id, txn_id) -> card_id from closed cases and case pack
known_txn_to_card = {}
with open('data/raw/closed_cases_history.csv', 'r') as f:
    for r in csv.DictReader(f):
        cid = r['card_id']
        cust = r['customer_id']
        tids = r['txn_ids'].split('|')
        for t in tids:
            if t:
                known_txn_to_card[t] = (cust, cid)

with open('data/raw/case_pack.csv', 'r') as f:
    for r in csv.DictReader(f):
        known_txn_to_card[r['flagged_txn_id']] = (r['customer_id'], r['card_id'])

print(f"Total known transaction -> card_id pairs: {len(known_txn_to_card)}")

# 2. Check the card attributes for these transactions
card_attr_to_card_id = {}
inconsistencies = 0

with open('data/raw/transactions.csv', 'r') as f:
    for r in csv.DictReader(f):
        tid = r['TransactionID']
        if tid in known_txn_to_card:
            cust, cid = known_txn_to_card[tid]
            # Key by customer and card attributes
            attr_key = (cust, r['card1'], r['card2'], r['card3'], r['card4'], r['card5'], r['card6'])
            if attr_key in card_attr_to_card_id and card_attr_to_card_id[attr_key] != cid:
                inconsistencies += 1
            else:
                card_attr_to_card_id[attr_key] = cid

print(f"Mapped {len(card_attr_to_card_id)} unique customer-card-attribute signatures.")
print(f"Inconsistencies: {inconsistencies}")
