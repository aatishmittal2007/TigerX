# HHGOA Fraud Investigation Dataset — Data Dictionary

This data dictionary is based on direct inspection of the real dataset provided for the Hacker House Goa (HHGOA) Fraud Investigation Challenge (IEEE-CIS edition).

---

## 1. Summary of Files

| File | Rows | Columns | Purpose |
|---|---|---|---|
| `case_pack.csv` | 20 | 8 | The 20 exam cases to be investigated by the agent (Nov–Dec 2016). |
| `closed_cases_history.csv` | 5,565 | 15 | Historical closed investigations (July–Oct 2016). Ground truth memory & GraphRAG retrieval. |
| `identity.csv` | 144,432 | 41 | Device and connection details for online transactions, joined on `TransactionID`. |
| `transactions.csv` | 590,742 | 397 | 6 months of card transactions (July 2 – Dec 31, 2016) with all Vesta columns + `customer_id`, `ts`, `channel`, `risk_score`. |

---

## 2. File Specifications & Columns

### A. `case_pack.csv`
Contains the 20 benchmark test cases.
- `case_id` (string): Unique identifier, `HHG-001` through `HHG-020`.
- `opened_at` (datetime): Timestamp when the alert was triggered.
- `trigger_type` (enum): Reason for alert:
  - `risk_score` (11 cases): Flagged by detection model.
  - `customer_report` (8 cases): Customer reported unrecognized charge.
  - `analyst_request` (1 case, HHG-014): Analyst requested review of shared device ring.
- `trigger_text` (string): Textual alert message.
- `flagged_txn_id` (string): Transaction ID where the alert originated.
- `card_id` (string): Card identifier (e.g. `C12382-K1`).
- `customer_id` (string): Customer identifier (e.g. `C12382`).
- `risk_score` (float or null): Model score (0.0 to 1.0) for `risk_score` triggers.

---

### B. `closed_cases_history.csv`
Contains 5,565 historical investigations (4,665 confirmed fraud, 900 cleared).
- `case_id` (string): `CC-0001` to `CC-5565`.
- `customer_id` (string): Customer involved.
- `card_id` (string): Card involved (e.g. `C00259-K1`).
- `opened_at` (datetime): Case opening time.
- `closed_at` (datetime): Case closing time.
- `outcome` (enum): `confirmed_fraud` (4,665) or `cleared` (900).
- `pattern` (enum):
  - `card_not_present_fraud` (1,404)
  - `account_takeover` (1,205)
  - `card_not_present_new_device` (1,076)
  - `out_of_region_use` (955)
  - `card_testing` (16)
  - `undocumented` (9): Structuring / threshold dodging (sub-$500) and multi-card proxy rings.
  - `none` (900): Legitimate / false alarms.
- `first_fraud_txn_id` (string): Where fraud began.
- `txn_ids` (string): Pipe-separated (`|`) list of all affected transactions.
- `n_txns` (integer): Number of transactions in episode.
- `exposure_usd` (float): Sum of dollar amounts in the fraud episode.
- `connected_card_ids` (string): Pipe-separated list of other cards compromised in the same ring.
- `actions_taken` (string): Actions executed (e.g. `CREATE_CASE|BLOCK_CARD`).
- `report_filed` (enum): `Yes` (397) or `No` (5,168).
- `analyst_notes` (string): Detailed summary of facts, devices, locations, and reasoning.

---

### C. `identity.csv`
Identity and device telemetry for online transactions (144,432 records). Joined to transactions via `TransactionID`.
- `TransactionID` (string): Primary key.
- `DeviceType` (enum): `mobile` or `desktop`.
- `DeviceInfo` (string): Device hardware/build string, e.g. `SAMSUNG SM-G892A Build/NRD90M`, `Trident/7.0`, `iOS Device`.
- `id_15` (enum): Device status for account: `New` or `Found`.
- `id_23` (enum): Proxy flag: `IP_PROXY:ANONYMOUS`, `IP_PROXY:HIDDEN`, `IP_PROXY:TRANSPARENT`.
- `id_30` (string): Operating System (e.g. `Android 7.0`, `Windows 10`, `iOS 11.1.2`).
- `id_31` (string): Browser (e.g. `chrome 62.0`, `samsung browser 6.2`, `ie 11.0 for desktop`).
- `id_33` (string): Screen resolution (e.g. `2220x1080`, `1920x1080`).
- `id_34` (string): Match status, e.g. `match_status:1`.
- `id_01` to `id_11`: Numeric ratings (login count, proxy rating, time on page).
- **Composite DeviceProfile**:
  `DeviceInfo | id_30 | id_31 | id_33` (e.g. `SAMSUNG SM-G892A Build/NRD90M | Android 7.0 | samsung browser 6.2 | 2220x1080`).

---

### D. `transactions.csv`
590,742 total transactions.
- `TransactionID` (string): Unique transaction ID.
- `ts` (datetime): Timestamp from `2016-07-02 00:02:21` to `2016-12-31 23:59:00`.
- `TransactionAmt` (float): Amount in USD.
- `ProductCD` (enum): `W` (in_person, no identity record), `C`, `H`, `R`, `S` (online).
- `channel` (enum): `in_person` or `online`.
- `risk_score` (float): 0.0 to 1.0 from real-time model.
- `customer_id` (string): Customer ID (e.g. `C12382`).
- `card1` to `card6`: Card attributes:
  - `card4`: Card network (`visa`, `mastercard`, `american express`, `discover`).
  - `card6`: Card type (`debit`, `credit`).
  - `card1`, `card2`, `card3`, `card5`: Issuer and configuration codes.
  - The combination of `(customer_id, card1..card6)` deterministically resolves `card_id` (`-K1`, `-K2`, `-K3`).
- `addr1` (string): Billing region code.
- `addr2` (string): Billing country code (`87` is home country).
- `P_emaildomain`, `R_emaildomain` (string): Purchaser and recipient email domains.
- `C1`–`C14`, `D1`–`D15`, `M1`–`M9`, `V1`–`V339`: Unnamed model features.

---

## 3. Graph Entity Metrics (Generated for Loading)

| Entity / Table | Count | Storage in `data/processed/` |
|---|---|---|
| `Customer` | 13,553 | 106 KB |
| `Card` | 14,850 | 364 KB |
| `Transaction` | 590,742 | 30 MB |
| `DeviceProfile` | 9,705 | 1.1 MB |
| `EmailDomain` | 59 | 725 B |
| `BillingRegion` | 332 | 2.3 KB |
| `ClosedCase` | 5,565 | 2.2 MB |
| `OWNS` edge | 14,850 | 262 KB |
| `MADE` edge | 590,742 | 11 MB |
| `FROM_DEVICE` edge | 144,432 | 7.3 MB |
| `USED_DEVICE` edge | ~150,000 | 3.9 MB |
| `BILLED_IN` edge | ~500,000 | 7.6 MB |
| `PURCHASER_EMAIL` edge | ~500,000 | 9.3 MB |
| `INVOLVES` edge (case-txn) | 14,975 | 249 KB |
