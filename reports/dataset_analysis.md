# Comprehensive Dataset Analysis Report — HHGOA Fraud Investigation

**Source Dataset**: IEEE-CIS Fraud Detection dataset (Vesta Corporation edition, prepared for Hacker House Goa 2026).  
**Inspection Date**: 2026-09-25  
**Analyzed Files**: `data/raw/transactions.csv`, `data/raw/identity.csv`, `data/raw/closed_cases_history.csv`, `data/raw/case_pack.csv`, `data/raw/README.md`.

---

## 1. Summary of Files & Volume

| File Name | Exact Row Count | Raw Size | Key Identifier | Description |
|---|---|---|---|---|
| `transactions.csv` | 590,742 | 708 MB | `TransactionID` | 6 months of card transactions (July 2 – Dec 31, 2016) with all Vesta columns + `customer_id`, `ts`, `channel`, `risk_score`. |
| `identity.csv` | 144,432 | 26.7 MB | `TransactionID` | Device and connection telemetry for online transactions. Joined to transactions on `TransactionID`. |
| `closed_cases_history.csv` | 5,565 | 2.7 MB | `case_id` | Historical investigations (July–Oct 2016). Ground truth memory (4,665 confirmed fraud, 900 cleared). |
| `case_pack.csv` | 20 | 3.5 KB | `case_id` | The 20 benchmark exam alerts (`HHG-001` through `HHG-020`). |

---

## 2. Column Schemas, Data Types & Cardinalities

### A. `transactions.csv` (590,742 rows)
- `TransactionID` (STRING, Unique PK): Disguised transaction identifier (e.g. `3000001` to `3589921`).
- `TransactionDT` (INT): Relative seconds from dataset start.
- `TransactionAmt` (FLOAT): Transaction amount in USD (e.g. `$0.25` to `$5,000.00`).
- `ProductCD` (STRING): Product category: `W` (in_person, 439,670 rows), `C` (online, 68,519 rows), `R` (online, 37,699 rows), `H` (online, 33,024 rows), `S` (online, 11,830 rows).
- `card1` to `card6` (MIXED):
  - `card1` (INT): Card issuer/bank code.
  - `card4` (STRING): Network (`visa`, `mastercard`, `american express`, `discover`).
  - `card6` (STRING): Card type (`debit`, `credit`, `charge card`).
- `addr1` (FLOAT/STRING): Anonymized billing region code (332 distinct values).
- `addr2` (FLOAT/STRING): Billing country code (`87.0` is home country).
- `P_emaildomain` / `R_emaildomain` (STRING): Purchaser and recipient email domain (59 unique domains).
- `customer_id` (STRING): Derived customer identifier (`C00001` to `C13553`, 13,553 unique customers).
- `ts` (DATETIME): Real calendar timestamp (`YYYY-MM-DD HH:MM:SS`), July 2 to December 31, 2016.
- `channel` (STRING): `in_person` (no device record, ProductCD `W`) vs `online` (ProductCD `C`, `R`, `H`, `S`).
- `risk_score` (FLOAT): 0.00 to 1.00 from bank detection model. **Input signal only, not a verdict.**
- `C1`–`C14`, `D1`–`D15`, `M1`–`M9`, `V1`–`V339`: Vesta model features.

### B. `identity.csv` (144,432 rows)
- `TransactionID` (STRING, PK): Joins 1-to-1 with online transactions.
- `DeviceType` (STRING): `mobile` vs `desktop`.
- `DeviceInfo` (STRING): Hardware/build signature (e.g. `SAMSUNG SM-G892A Build/NRD90M`, `Trident/7.0`, `iOS Device`).
- `id_15` (STRING): Device account status: `New` (device not previously seen) vs `Found` (recognized device).
- `id_23` (STRING): Proxy rating: `IP_PROXY:ANONYMOUS`, `IP_PROXY:HIDDEN`, `IP_PROXY:TRANSPARENT`.
- `id_30` (STRING): Operating System (e.g. `Android 7.0`, `Windows 10`, `iOS 11.1.2`, `Mac OS X 10_12_6`).
- `id_31` (STRING): Browser (e.g. `chrome 62.0`, `samsung browser 6.2`, `mobile safari 11.0`).
- `id_33` (STRING): Screen resolution (e.g. `2220x1080`, `1920x1080`, `1334x750`).
- `id_34` (STRING): Match status flag.
- **Composite DeviceProfile**: Formatted as `DeviceInfo | id_30 | id_31 | id_33` (9,705 unique profiles).

### C. `closed_cases_history.csv` (5,565 rows)
- `case_id` (STRING, PK): `CC-0001` through `CC-5565`.
- `customer_id` (STRING): Customer ID.
- `card_id` (STRING): Specific card involved (`C00259-K1`, `C08623-K2`).
- `outcome` (STRING): `confirmed_fraud` (4,665, 83.8%) or `cleared` (900, 16.2%).
- `pattern` (STRING):
  - `card_not_present_fraud`: 1,404
  - `account_takeover`: 1,205
  - `card_not_present_new_device`: 1,076
  - `out_of_region_use`: 955
  - `card_testing`: 16
  - `undocumented`: 9 (Structuring / threshold dodging and multi-card proxy rings)
  - `none`: 900 (Cleared / false alarms)
- `first_fraud_txn_id` (STRING): Start of fraud episode.
- `txn_ids` (STRING): Pipe-delimited list of affected transaction IDs (14,975 total linked transactions).
- `exposure_usd` (FLOAT): Sum of absolute transaction amounts in the fraud episode.
- `connected_card_ids` (STRING): Pipe-delimited list of other cards compromised in the same ring.
- `report_filed` (STRING): `Yes` (397, 7.1%) or `No` (5,168, 92.9%).
- `analyst_notes` (STRING): Detailed factual investigation summary.

### D. `case_pack.csv` (20 rows)
- Benchmark test suite (`HHG-001` through `HHG-020`):
  - 11 `risk_score` alerts (0.52 to 0.90)
  - 8 `customer_report` alerts
  - 1 `analyst_request` alert (`HHG-014`, targeting device ring)

---

## 3. Relationships & Join Quality

1. **Transaction to Identity Join**:
   - `TransactionID` in `identity.csv` maps 100% into `transactions.csv` (all 144,432 rows match).
   - Only online product codes (`C`, `R`, `H`, `S`) have identity records. Product code `W` has 0 identity records (in-person purchases).
2. **Customer to Card Signature Resolution**:
   - Verified across 14,975 transactions in closed cases: `(customer_id, card1, card2, card3, card4, card5, card6)` maps to `card_id` (`-K1`, `-K2`, `-K3`) with **0 inconsistencies**.
3. **Multi-Card Device Rings**:
   - 9,705 unique `DeviceProfile` instances exist.
   - Significant multi-card clustering detected (e.g. `SM-G935F Build/NRD90M | Android 7.0 | chrome 62.0 for android | 1920x1080` links to 51 different cards, solving `HHG-014`).

---

## 4. Graph Schema & Loading Strategy

### Entities (Vertices)
1. `Customer`: 13,553 vertices (`id`)
2. `Card`: 14,850 vertices (`id`, `network`, `card_type`)
3. `Transaction`: 590,742 vertices (`id`, `ts`, `amt`, `product_cd`, `channel`, `risk_score`)
4. `DeviceProfile`: 9,705 vertices (`id`, `device_info`, `os_name`, `browser`, `screen`, `is_new`, `proxy_type`)
5. `EmailDomain`: 59 vertices (`id`)
6. `BillingRegion`: 332 vertices (`id`)
7. `ClosedCase`: 5,565 vertices (`id`, `outcome`, `pattern`, `exposure_usd`, `report_filed`, `analyst_notes`, `opened_at`, `closed_at`)
8. `FraudCase`: Dynamic investigation memory vertex (`id`, `status`, `verdict`, `fraud_probability`, `pattern`, `exposure_usd`, `summary`, `opened_at`)

### Edges
- `Customer` → `OWNS` → `Card` (14,850 edges)
- `Card` → `MADE` → `Transaction` (590,742 edges)
- `Transaction` → `FROM_DEVICE` → `DeviceProfile` (144,432 edges)
- `Card` → `USED_DEVICE` → `DeviceProfile` (~150,000 edges)
- `Transaction` → `BILLED_IN` → `BillingRegion` (~500,000 edges)
- `Transaction` → `PURCHASER_EMAIL` → `EmailDomain` (~500,000 edges)
- `Transaction` → `NEXT` → `Transaction` (temporal sequence on card)
- `ClosedCase` → `INVOLVES` → `Transaction` (14,975 edges)
- `ClosedCase` → `ON_CARD` → `Card` (5,565 edges)
- `ClosedCase` → `CONNECTED_TO` → `Card` (1,842 edges)
- `FraudCase` → `INVESTIGATES` → `Transaction`
- `FraudCase` → `CASE_ON_CARD` → `Card`
- `FraudCase` → `CASE_CONNECTED_CARD` → `Card`

### Ingestion Strategy
- Processed raw 708 MB transactions file into clean, dedicated CSVs in `data/processed/` (72 MB total).
- Bypasses raw feature columns `V1`–`V339` during graph loading to ensure high-performance in-memory execution and zero memory bloat.
