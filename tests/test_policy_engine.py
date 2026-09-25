from backend.services.policy_engine import evaluate_policy, ACTION_BLOCK_CARD, ACTION_VERIFY_WITH_CUSTOMER, ACTION_FILE_REPORT

def test_r1_weak_signal():
    actions, file_sar, _ = evaluate_policy(
        verdict="uncertain",
        fraud_probability=0.55,
        pattern="card_not_present_fraud",
        exposure_usd=120.0,
        evidence_claims=[],
        connected_cards=[],
        single_signal_only=True
    )
    action_names = [a["action"] for a in actions]
    assert ACTION_VERIFY_WITH_CUSTOMER in action_names
    assert not file_sar
    print("Test R1 Passed!")

def test_r2_denial_with_connected_cards():
    actions, file_sar, reason = evaluate_policy(
        verdict="fraud",
        fraud_probability=0.86,
        pattern="card_testing",
        exposure_usd=268.43,
        evidence_claims=[],
        connected_cards=["C00877-K1"],
        customer_response="denied"
    )
    action_names = [a["action"] for a in actions]
    assert ACTION_BLOCK_CARD in action_names
    assert actions[0]["route"] == "L1" # exposure <= 2500
    assert file_sar is True
    assert ACTION_FILE_REPORT in action_names
    print("Test R2 Passed!")

def test_high_exposure_approval_escalation():
    actions, file_sar, _ = evaluate_policy(
        verdict="fraud",
        fraud_probability=0.92,
        pattern="account_takeover",
        exposure_usd=3500.0,
        evidence_claims=[],
        connected_cards=[],
        customer_response="denied"
    )
    block_action = [a for a in actions if a["action"] == ACTION_BLOCK_CARD][0]
    assert block_action["route"] == "L2" # exposure > 2500 escalates to L2
    assert file_sar is True
    print("Test High Exposure L2 Escalation Passed!")

if __name__ == "__main__":
    test_r1_weak_signal()
    test_r2_denial_with_connected_cards()
    test_high_exposure_approval_escalation()
    print("ALL POLICY ENGINE TESTS PASSED!")
