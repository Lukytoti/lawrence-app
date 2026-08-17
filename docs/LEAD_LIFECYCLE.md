# Lead Lifecycle & Transition Matrix — Module 06

## 1. Status Transition Matrix

| Current Status | Allowed Transition Target Status | Triggering Action / Service Call |
| :--- | :--- | :--- |
| `NEW` | `CONTACTED`, `ENGAGED`, `DORMANT` | First outreach recorded or stage update |
| `CONTACTED` | `ENGAGED`, `QUALIFIED`, `LOST` | Inbound response or presentation booked |
| `ENGAGED` | `QUALIFIED`, `APPOINTMENT_BOOKED`, `LOST` | Discovery meeting scheduled |
| `QUALIFIED` | `PROPOSAL_SENT`, `NEGOTIATION`, `CONVERTED` | Opportunity created or member converted |
| `CONVERTED` | *Terminal State* | Converted to NetworkMember / DigitalClient |
| `LOST` | `NURTURE`, `REOPENED` | Follow-up sequence initiated |

## 2. Chronological Timeline Event Aggregation
The Lead Cockpit constructs a unified chronological stream from:
1. `CrmLead` creation.
2. `CrmStageHistory` stage movements.
3. `CrmInteraction` outreach logs.
4. `CrmFollowUp` tasks.
5. `CrmAppointment` presentations.
6. `CrmOpportunity` registrations.
