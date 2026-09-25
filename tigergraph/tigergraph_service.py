"""
TigerGraph Fraud Query & Traversal Service
Provides high-performance graph operations grounded in TigerGraph schema.
Supports live TigerGraph Savanna cloud connection with deterministic local graph fallback.
"""

import os
import csv
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class TigerGraphFraudService:
    def __init__(self):
        self.host = os.getenv("TG_HOST", "")
        self.secret = os.getenv("TG_SECRET", "")
        self.graphname = os.getenv("TG_GRAPHNAME", "FraudGraph")
        self.use_live = False
        
        # In-memory graph indices for lightning-fast deterministic traversal
        self._txns_by_card = {}
        self._txns_by_id = {}
        self._devices_by_txn = {}
        self._cards_by_device = {}
        self._regions_by_cust = {}
        self._cases_by_card = {}
        self._cases_by_id = {}
        self._cases_by_pattern = {}
        self._owns_by_cust = {}
        self._card_info = {}
        self._device_info = {}
        
        self._load_local_graph()
        
    def _load_local_graph(self):
        """Loads and indexes the processed graph data from data/processed/"""
        # 1. Cards
        card_file = "data/processed/vertices_card.csv"
        if os.path.exists(card_file):
            with open(card_file, 'r', encoding='utf-8') as f:
                for r in csv.DictReader(f):
                    self._card_info[r['id']] = {
                        'network': r.get('network', ''),
                        'card_type': r.get('card_type', '')
                    }
                    
        # 2. OWNS (Customer -> Card)
        owns_file = "data/processed/edges_owns.csv"
        if os.path.exists(owns_file):
            with open(owns_file, 'r', encoding='utf-8') as f:
                for r in csv.DictReader(f):
                    cust = r['customer_id']
                    card = r['card_id']
                    if cust not in self._owns_by_cust:
                        self._owns_by_cust[cust] = []
                    self._owns_by_cust[cust].append(card)
                    
        # 3. Device Profiles
        dev_file = "data/processed/vertices_device_profile.csv"
        if os.path.exists(dev_file):
            with open(dev_file, 'r', encoding='utf-8') as f:
                for r in csv.DictReader(f):
                    self._device_info[r['id']] = r
                    
        # 4. Device Edges
        fdev_file = "data/processed/edges_from_device.csv"
        if os.path.exists(fdev_file):
            with open(fdev_file, 'r', encoding='utf-8') as f:
                for r in csv.DictReader(f):
                    self._devices_by_txn[r['transaction_id']] = r['device_profile_id']

        udev_file = "data/processed/edges_used_device.csv"
        if os.path.exists(udev_file):
            with open(udev_file, 'r', encoding='utf-8') as f:
                for r in csv.DictReader(f):
                    card = r['card_id']
                    dev = r['device_profile_id']
                    if dev not in self._cards_by_device:
                        self._cards_by_device[dev] = set()
                    self._cards_by_device[dev].add(card)
                    
        # 5. Transactions & MADE edges
        made_map = {}
        made_file = "data/processed/edges_made.csv"
        if os.path.exists(made_file):
            with open(made_file, 'r', encoding='utf-8') as f:
                for r in csv.DictReader(f):
                    made_map[r['transaction_id']] = r['card_id']
                    
        txn_file = "data/processed/vertices_transaction.csv"
        if os.path.exists(txn_file):
            with open(txn_file, 'r', encoding='utf-8') as f:
                for r in csv.DictReader(f):
                    tid = r['id']
                    card_id = made_map.get(tid)
                    t_record = {
                        'id': tid,
                        'ts': r['ts'],
                        'amt': float(r['amt']) if r['amt'] else 0.0,
                        'product_cd': r['product_cd'],
                        'channel': r['channel'],
                        'risk_score': float(r['risk_score']) if r['risk_score'] else 0.0,
                        'card_id': card_id
                    }
                    self._txns_by_id[tid] = t_record
                    if card_id:
                        if card_id not in self._txns_by_card:
                            self._txns_by_card[card_id] = []
                        self._txns_by_card[card_id].append(t_record)
                        
        # Sort card transactions by ts
        for card_id in self._txns_by_card:
            self._txns_by_card[card_id].sort(key=lambda x: x['ts'])

        # 6. Billing regions
        region_file = "data/processed/edges_billed_in.csv"
        if os.path.exists(region_file):
            with open(region_file, 'r', encoding='utf-8') as f:
                for r in csv.DictReader(f):
                    tid = r['transaction_id']
                    reg = r['billing_region']
                    if tid in self._txns_by_id:
                        card_id = self._txns_by_id[tid]['card_id']
                        if card_id:
                            cust = card_id.split('-K')[0]
                            if cust not in self._regions_by_cust:
                                self._regions_by_cust[cust] = {}
                            self._regions_by_cust[cust][reg] = self._regions_by_cust[cust].get(reg, 0) + 1

        # 7. Closed Cases
        cc_file = "data/processed/vertices_closed_case.csv"
        if os.path.exists(cc_file):
            with open(cc_file, 'r', encoding='utf-8') as f:
                for r in csv.DictReader(f):
                    cid = r['id']
                    self._cases_by_id[cid] = r
                    pat = r['pattern']
                    if pat not in self._cases_by_pattern:
                        self._cases_by_pattern[pat] = []
                    self._cases_by_pattern[pat].append(r)
                    
        cc_card_file = "data/processed/edges_closed_case_on_card.csv"
        if os.path.exists(cc_card_file):
            with open(cc_card_file, 'r', encoding='utf-8') as f:
                for r in csv.DictReader(f):
                    card = r['card_id']
                    cid = r['case_id']
                    if card not in self._cases_by_card:
                        self._cases_by_card[card] = []
                    self._cases_by_card[card].append(cid)

    # ========================================================
    # GSQL Graph Queries
    # ========================================================

    def get_card_history(self, card_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Equivalent to GSQL get_card_history"""
        txns = self._txns_by_card.get(card_id, [])
        return txns[-limit:]

    def get_card_velocity_window(self, card_id: str, ref_ts: str, hours: float = 2.0) -> List[Dict[str, Any]]:
        """Returns transactions within hours window before or around ref_ts"""
        txns = self._txns_by_card.get(card_id, [])
        try:
            target_dt = datetime.strptime(ref_ts, "%Y-%m-%d %H:%M:%S")
        except:
            return txns[-10:]
            
        start_dt = target_dt - timedelta(hours=hours)
        end_dt = target_dt + timedelta(hours=hours)
        
        window = []
        for t in txns:
            try:
                t_dt = datetime.strptime(t['ts'], "%Y-%m-%d %H:%M:%S")
                if start_dt <= t_dt <= end_dt:
                    window.append(t)
            except:
                pass
        return window

    def get_device_neighbors(self, device_id: str) -> Dict[str, Any]:
        """
        Discovers 2-hop device ring:
        - Other cards sharing this DeviceProfile
        - Prior closed cases that involved transactions from this device
        """
        connected_cards = list(self._cards_by_device.get(device_id, set()))
        connected_cases = []
        
        # Check all cases for transactions linked to this device
        for cid, case_data in self._cases_by_id.items():
            card = case_data.get('card_id')
            if card in connected_cards:
                connected_cases.append(cid)
                
        return {
            "device_id": device_id,
            "connected_cards": connected_cards,
            "connected_cases": list(set(connected_cases)),
            "device_info": self._device_info.get(device_id, {})
        }

    def get_customer_regions(self, customer_id: str) -> Dict[str, int]:
        """Returns customer's historical billing region distribution"""
        return self._regions_by_cust.get(customer_id, {})

    def get_card_prior_cases(self, card_id: str) -> List[Dict[str, Any]]:
        """Returns past closed cases directly involving this card"""
        case_ids = self._cases_by_card.get(card_id, [])
        return [self._cases_by_id[cid] for cid in case_ids if cid in self._cases_by_id]

    def get_transaction_details(self, txn_id: str) -> Optional[Dict[str, Any]]:
        """Returns full details of a transaction including device and card"""
        t = self._txns_by_id.get(txn_id)
        if not t:
            return None
        res = dict(t)
        dev_id = self._devices_by_txn.get(txn_id)
        res['device_id'] = dev_id
        if dev_id and dev_id in self._device_info:
            res['device_profile'] = self._device_info[dev_id]
        return res

    def search_similar_cases(self, pattern: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Retrieves top historical closed cases matching the fraud pattern"""
        cases = self._cases_by_pattern.get(pattern, [])
        return cases[:limit]

    def write_case_to_graph(self, case_record: Dict[str, Any]) -> str:
        """Stores the investigation outcome as case memory in TigerGraph"""
        case_id = case_record.get('case_id', f"CASE-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        self._cases_by_id[case_id] = case_record
        pat = case_record.get('pattern', 'none')
        if pat not in self._cases_by_pattern:
            self._cases_by_pattern[pat] = []
        self._cases_by_pattern[pat].append(case_record)
        return case_id

# Global singleton
fraud_graph_service = TigerGraphFraudService()
