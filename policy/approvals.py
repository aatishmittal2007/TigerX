"""
Fraud Policy Approval Routing (Policy v1.0)
Maps policy actions and exposure thresholds to exact approval routes:
- auto: agent may act alone
- L1: team lead must approve
- L2: fraud manager must approve
"""

from policy.actions import *

def get_approval_route(action: str, exposure_usd: float = 0.0) -> str:
    if action in [
        ALLOW_TRANSACTION, MONITOR_CARD, MONITOR_CONNECTED_CARDS, WARN_CUSTOMER,
        VERIFY_WITH_CUSTOMER, STEP_UP_AUTH, GENERATE_REPORT, CREATE_CASE,
        ESCALATE_TO_ANALYST, CLOSE_NO_FRAUD
    ]:
        return "auto"
        
    if action == DECLINE_TRANSACTION:
        return "L1"
        
    if action == BLOCK_CARD:
        return "L1" if exposure_usd <= 2500.0 else "L2"
        
    if action in [BLOCK_ALL_CARDS, FILE_REPORT]:
        return "L2"
        
    return "L1"
