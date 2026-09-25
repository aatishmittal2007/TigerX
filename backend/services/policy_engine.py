"""
Deterministic Policy Engine for HHGOA Fraud Investigation
Strict implementation of Fraud Policy Version 1.0 (Rules R1 - R10)
"""

from typing import List, Dict, Any, Tuple

# Valid Action Enums
ACTION_ALLOW_TRANSACTION = "ALLOW_TRANSACTION"
ACTION_DECLINE_TRANSACTION = "DECLINE_TRANSACTION"
ACTION_MONITOR_CARD = "MONITOR_CARD"
ACTION_MONITOR_CONNECTED_CARDS = "MONITOR_CONNECTED_CARDS"
ACTION_WARN_CUSTOMER = "WARN_CUSTOMER"
ACTION_VERIFY_WITH_CUSTOMER = "VERIFY_WITH_CUSTOMER"
ACTION_STEP_UP_AUTH = "STEP_UP_AUTH"
ACTION_BLOCK_CARD = "BLOCK_CARD"
ACTION_BLOCK_ALL_CARDS = "BLOCK_ALL_CARDS"
ACTION_GENERATE_REPORT = "GENERATE_REPORT"
ACTION_CREATE_CASE = "CREATE_CASE"
ACTION_FILE_REPORT = "FILE_REPORT"
ACTION_ESCALATE_TO_ANALYST = "ESCALATE_TO_ANALYST"
ACTION_CLOSE_NO_FRAUD = "CLOSE_NO_FRAUD"

def get_approval_route(action: str, exposure_usd: float = 0.0) -> str:
    """
    Assigns strict approval route based on action and exposure:
    - auto: agent may act alone
    - L1: team lead must approve
    - L2: fraud manager must approve
    """
    if action in [
        ACTION_ALLOW_TRANSACTION,
        ACTION_MONITOR_CARD,
        ACTION_MONITOR_CONNECTED_CARDS,
        ACTION_WARN_CUSTOMER,
        ACTION_VERIFY_WITH_CUSTOMER,
        ACTION_STEP_UP_AUTH,
        ACTION_GENERATE_REPORT,
        ACTION_CREATE_CASE,
        ACTION_ESCALATE_TO_ANALYST,
        ACTION_CLOSE_NO_FRAUD
    ]:
        return "auto"
        
    if action == ACTION_DECLINE_TRANSACTION:
        return "L1"
        
    if action == ACTION_BLOCK_CARD:
        return "L1" if exposure_usd <= 2500.0 else "L2"
        
    if action in [ACTION_BLOCK_ALL_CARDS, ACTION_FILE_REPORT]:
        return "L2"
        
    return "L1"

def evaluate_policy(
    verdict: str,
    fraud_probability: float,
    pattern: str,
    exposure_usd: float,
    evidence_claims: List[Dict[str, Any]],
    connected_cards: List[str],
    customer_response: str = None, # "denied", "confirmed", "no_reply", or None
    is_recurring_dispute: bool = False,
    single_signal_only: bool = False,
    has_cleared_large_purchase: bool = False
) -> Tuple[List[Dict[str, str]], bool, str]:
    """
    Evaluates policy rules and returns:
    (actions_list, should_file_sar, sar_reason)
    """
    actions = []
    file_sar = False
    sar_reason = ""
    
    # R3: Customer confirms transaction
    if customer_response == "confirmed":
        actions.append({
            "action": ACTION_CLOSE_NO_FRAUD,
            "route": "auto",
            "reason": "R3: customer confirmed the transaction as legitimate"
        })
        return actions, False, ""
        
    # R7: Disputed but legitimate (recurring pattern)
    if is_recurring_dispute:
        actions.extend([
            {"action": ACTION_CREATE_CASE, "route": "auto", "reason": "R7: disputed charge matches recurring baseline"},
            {"action": ACTION_VERIFY_WITH_CUSTOMER, "route": "auto", "reason": "R7: verify recurring subscription details"},
            {"action": ACTION_WARN_CUSTOMER, "route": "auto", "reason": "R7: recurring charge reminder"}
        ])
        return actions, False, ""

    # R2: Customer denies transaction
    if customer_response == "denied":
        actions.append({
            "action": ACTION_BLOCK_CARD,
            "route": get_approval_route(ACTION_BLOCK_CARD, exposure_usd),
            "reason": f"R2: customer denied transaction; exposure ${exposure_usd:,.2f}"
        })
        actions.append({
            "action": ACTION_CREATE_CASE,
            "route": "auto",
            "reason": "R2: confirmed unauthorized use recorded internally"
        })
        
        # SAR check under R2: exposure > $1,000 OR connected to shared device / another card
        if exposure_usd > 1000.0 or len(connected_cards) > 0:
            file_sar = True
            sar_reason = "R2: confirmed unauthorized use with " + (
                f"exposure ${exposure_usd:,.2f} exceeding $1,000" if exposure_usd > 1000.0 else f"shared device linking to {len(connected_cards)} other card(s)"
            )
            actions.append({
                "action": ACTION_FILE_REPORT,
                "route": "L2",
                "reason": sar_reason
            })
            
        if len(connected_cards) > 0:
            actions.append({
                "action": ACTION_MONITOR_CONNECTED_CARDS,
                "route": "auto",
                "reason": f"R6: shared infrastructure links to {', '.join(connected_cards)}"
            })
        return actions, file_sar, sar_reason

    # R4: Customer validation timed out
    if customer_response == "no_reply":
        actions.append({
            "action": ACTION_MONITOR_CARD,
            "route": "auto",
            "reason": "R4: no customer reply within 24 hours"
        })
        actions.append({
            "action": ACTION_DECLINE_TRANSACTION,
            "route": "L1",
            "reason": "R4: decline pending authorization while unverified"
        })
        if exposure_usd > 500.0:
            actions.append({
                "action": ACTION_ESCALATE_TO_ANALYST,
                "route": "auto",
                "reason": "R4: exposure exceeds $500 without cardholder reply"
            })
        return actions, False, ""

    # R5: Card testing sequence
    if pattern == "card_testing":
        actions.append({
            "action": ACTION_DECLINE_TRANSACTION,
            "route": "L1",
            "reason": "R5: rapid testing sequence observed"
        })
        actions.append({
            "action": ACTION_STEP_UP_AUTH,
            "route": "auto",
            "reason": "R5: require step-up authentication on card"
        })
        if has_cleared_large_purchase:
            actions.append({
                "action": ACTION_BLOCK_CARD,
                "route": get_approval_route(ACTION_BLOCK_CARD, exposure_usd),
                "reason": "R5: large purchase over $100 has already cleared"
            })
        return actions, False, ""

    # R1: Weak signal check (prob < 0.70 on single signal)
    if single_signal_only and fraud_probability < 0.70:
        actions.append({
            "action": ACTION_VERIFY_WITH_CUSTOMER,
            "route": "auto",
            "reason": "R1: weak single signal with probability < 0.70; verify before blocking"
        })
        actions.append({
            "action": ACTION_STEP_UP_AUTH,
            "route": "auto",
            "reason": "R1: require step-up authentication pending verification"
        })
        return actions, False, ""

    # R6 / Shared origin with multi-card compromise
    if len(connected_cards) > 0 and verdict == "fraud":
        actions.append({
            "action": ACTION_CREATE_CASE,
            "route": "auto",
            "reason": "R6: multi-card coordinated activity detected"
        })
        actions.append({
            "action": ACTION_BLOCK_CARD,
            "route": get_approval_route(ACTION_BLOCK_CARD, exposure_usd),
            "reason": f"R6: compromised in shared origin ring; exposure ${exposure_usd:,.2f}"
        })
        file_sar = True
        sar_reason = f"R6: shared infrastructure links to {len(connected_cards)} connected cards"
        actions.append({
            "action": ACTION_FILE_REPORT,
            "route": "L2",
            "reason": sar_reason
        })
        actions.append({
            "action": ACTION_MONITOR_CONNECTED_CARDS,
            "route": "auto",
            "reason": f"R6: monitor connected cards: {', '.join(connected_cards)}"
        })
        return actions, file_sar, sar_reason

    # R9: Undocumented pattern with coordinated or repeated abuse
    if pattern == "undocumented" and verdict == "fraud":
        actions.append({
            "action": ACTION_CREATE_CASE,
            "route": "auto",
            "reason": "R9: undocumented abuse pattern identified"
        })
        file_sar = True
        sar_reason = "R9: coordinated undocumented fraud typology"
        actions.append({
            "action": ACTION_FILE_REPORT,
            "route": "L2",
            "reason": sar_reason
        })
        actions.append({
            "action": ACTION_ESCALATE_TO_ANALYST,
            "route": "auto",
            "reason": "R9: escalate undocumented typology to fraud analyst"
        })
        actions.append({
            "action": ACTION_BLOCK_CARD,
            "route": get_approval_route(ACTION_BLOCK_CARD, exposure_usd),
            "reason": "R9: block card subject to undocumented coordinated abuse"
        })
        return actions, file_sar, sar_reason

    # R8: Uncertain verdict with exposure > $500
    if verdict == "uncertain":
        if exposure_usd > 500.0:
            actions.append({
                "action": ACTION_ESCALATE_TO_ANALYST,
                "route": "auto",
                "reason": "R8: uncertain verdict with exposure exceeding $500"
            })
            actions.append({
                "action": ACTION_MONITOR_CARD,
                "route": "auto",
                "reason": "R8: monitor card while uncertain"
            })
        else:
            actions.append({
                "action": ACTION_VERIFY_WITH_CUSTOMER,
                "route": "auto",
                "reason": "R1 & R8: verify with cardholder to resolve uncertainty"
            })
        return actions, False, ""

    # High confidence fraud (prob >= 0.70 or >= 0.85)
    if verdict == "fraud" or fraud_probability >= 0.70:
        actions.append({
            "action": ACTION_BLOCK_CARD,
            "route": get_approval_route(ACTION_BLOCK_CARD, exposure_usd),
            "reason": f"High confidence fraud assessment ({fraud_probability:.2f}); exposure ${exposure_usd:,.2f}"
        })
        actions.append({
            "action": ACTION_CREATE_CASE,
            "route": "auto",
            "reason": "Open internal fraud case with supporting evidence"
        })
        if exposure_usd > 1000.0:
            file_sar = True
            sar_reason = f"Exposure of ${exposure_usd:,.2f} exceeds $1,000 regulatory reporting threshold"
            actions.append({
                "action": ACTION_FILE_REPORT,
                "route": "L2",
                "reason": sar_reason
            })
        return actions, file_sar, sar_reason

    # Default legitimate verdict
    actions.append({
        "action": ACTION_ALLOW_TRANSACTION,
        "route": "auto",
        "reason": "Activity assessed as legitimate based on account baseline and absence of compromise"
    })
    actions.append({
        "action": ACTION_CLOSE_NO_FRAUD,
        "route": "auto",
        "reason": "Close alert with no fraud finding"
    })
    return actions, False, ""
