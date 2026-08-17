# Leadership Training System Specification

## Overview
The Training System manages structured leadership education, step-up orientation, and progress verification.

## Scope Materialization
When training is assigned to a `TEAM` scope (`teamRootMemberId`), the system queries `getDownlineMemberIds(teamRootMemberId)` and creates individual `TrainingAssignment` records for `[teamRootMemberId, ...downlineMemberIds]` with unique constraint `@@unique([trainingId, assignedToMemberId])`.

## Identity Single Source of Truth
`TrainingProgress` links exclusively via `assignmentId` to `TrainingAssignment`, which holds `assignedToMemberId`. Member identity is always derived via `progress.assignment.assignedToMemberId`.
