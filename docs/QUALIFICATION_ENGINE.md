# Qualification Engine Documentation

## 1. Overview
The Qualification Engine manages period-sensitive member activity evaluations, SVB rate table lookups, and historical qualification records.

## 2. Period Qualification Structure (`MemberQualification`)
Qualifications are linked to a specific `QualificationPeriod` (Year/Month e.g. August 2026).

Fields recorded:
- `pv`: Personal Volume
- `ppv`: Personal Point Value
- `qpv`: Qualified Point Value
- `bv`: Bonus Volume
- `svbRatePercent`: Applicable Sales Volume Bonus rate %
- `activeStatus`: Active status boolean
- `qualifiedStatus`: `QUALIFIED` or `NOT_QUALIFIED`

## 3. Verified SVB Rate Lookup Table (Nigeria NeoLife Plan)
| QPV Range | Applicable SVB Rate % |
| :--- | :--- |
| **0 - 249.99 QPV** | 0.00% |
| **250 - 499.99 QPV** | 3.00% |
| **500 - 999.99 QPV** | 5.00% |
| **1,000 - 1,999.99 QPV** | 10.00% |
| **2,000 - 2,999.99 QPV** | 15.00% |
| **3,000 - 3,999.99 QPV** | 20.00% |
| **4,000+ QPV** | 25.00% |

## 4. Immutability Principle
Every `MemberQualification` record is linked to a `PlanVersion`. If a historical qualification was calculated under `Nigeria Plan Version 2026.1`, it will permanently reference `Version 2026.1` even after a newer plan version (`2027.1`) is deployed.
