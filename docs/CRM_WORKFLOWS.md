# CRM Operational Workflows — Module 06

## 1. Prospect Intake & Duplicate Prevention
1. **Phone Normalization**: All phone numbers are formatted to standard international E.164 format (e.g. `+2348031112233`).
2. **Duplicate Search**: Before creating a new lead, system checks normalized email and phone against active records.
3. **Lead Code Assignment**: Lead receives unique sequential code `LEAD-10001`.

## 2. Stage Progression & Opportunity Tracking
- Moving a lead across pipeline stages creates an immutable `CrmStageHistory` record.
- Opportunities registered against leads track commercial potential. Financial updates execute through Prompt 05 financial ledger.

## 3. Atomic Lead Merging
- Merging duplicate leads transfers all opportunities, follow-ups, appointments, notes, and interactions to the primary lead record, while marking the duplicate lead as `DORMANT` and archiving it.

## 4. Lead Conversion to NetworkMember or DigitalClient
- When a prospect joins NeoLife or contracts digital marketing services, click **Convert to Member** or **Convert to Client**.
- Conversion creates the corresponding `NetworkMember` (or `DigitalClient`), sets `convertedMemberId` (or `convertedClientId`), and updates lead status to `CONVERTED`.
