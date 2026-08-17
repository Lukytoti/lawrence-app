# SECURITY RISK REGISTER & SCORING MATRIX

## 1. Risk Scoring Formula
Risk score is calculated deterministically as:
$$\text{riskScore} = \text{likelihood} \times \text{impact}$$
- `likelihood`: Scale 1 (Rare) to 5 (Almost Certain)
- `impact`: Scale 1 (Insignificant) to 5 (Catastrophic)
- `riskScore`: Range 1 to 25

## 2. Risk State Machine
- `OPEN`: Risk identified and registered.
- `MITIGATING`: Active mitigation plan assigned and executing.
- `ACCEPTED`: Residual risk formally accepted by owner.
- `RESOLVED`: Risk eliminated or fully mitigated; emits `SecurityRiskResolved`.
- `CLOSED`: Closed risk record.
