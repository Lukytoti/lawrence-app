# Engagement Engine & Leadership Attention Signals

## Overview
The Engagement Engine calculates an explainable $0-100$ point score based on community participation, training completions, posts, comments, reactions, and messaging responsiveness.

## Separation from ProductivityScore
- `ProductivityScore` (Prompt 04): Evaluates operational tasks, sales activities, and Personal Volume (PV).
- `EngagementScore` (Prompt 07): Evaluates community interaction and leadership responsiveness.

## Leadership Attention Signals
Monitors member risk levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) based on overdue training modules, low engagement scores, and exited/at-risk status, generating actionable `LeadershipAttentionAlert` records.
