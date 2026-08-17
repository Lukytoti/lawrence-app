# Earnings Calculation & Historical Snapshot Specification

## Itemized Earnings Calculation Formulas

### 1. Sales Volume Bonus (SVB)

$$\text{SVB Rate (\%)} = \text{ResolveSVBTier}(\text{QPV})$$

$$\text{Monetary SVB} = \text{BaseVolume} \times \frac{\text{SVB Rate (\%)}}{100}$$

Where `BaseVolume` is defined in `CompensationRule.configurationJson.monetaryFormulaBase` (e.g., `BV` or `QPV`).

If `monetaryFormulaBase` is unconfigured:

$$\text{Monetary SVB} = 0.0000 \text{ NGN}$$

---

### 2. Leadership Development Bonus (LDB)

Unconfigured by default:

$$\text{Monetary LDB} = 0.0000 \text{ NGN}$$

---

### 3. Network Development Bonus (NDB)

Unconfigured by default:

$$\text{Monetary NDB} = 0.0000 \text{ NGN}$$

---

## Historical Snapshot Schema (`snapshotJson`)

Each `MemberCompensationResult` contains a complete self-contained JSON snapshot:

```json
{
  "planVersionId": "clx...",
  "planVersionName": "NeoLife Nigeria 2026.1",
  "periodId": "clx...",
  "achievedRankCode": "EMERALD_DIRECTOR",
  "achievedRankLevel": 70,
  "qualifiedRankCode": "EMERALD_DIRECTOR",
  "qualifiedRankLevel": 70,
  "pv": 4200.0,
  "ppv": 150.0,
  "qpv": 4200.0,
  "bv": 4200.0,
  "activeStatus": true,
  "qualifiedStatus": "QUALIFIED",
  "calculationVersion": "1.0.0",
  "evaluatedAt": "2026-08-15T06:00:00.000Z"
}
```
