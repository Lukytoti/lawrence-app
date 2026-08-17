# Contract Renewal Engine & Historical Preservation

## 1. Expiration Windows
The engine monitors active contracts against 90, 60, 30, 14, and 7-day expiration windows.

## 2. Idempotency Safeguard
Duplicate renewal records are automatically prevented for the same contract and expiration window.

## 3. Contract Preservation
When a renewal is marked `RENEWED`, the historical contract remains completely untouched. A new contract version is generated via Prompt 11 `createClientContract()`, setting `renewedContractId`.
