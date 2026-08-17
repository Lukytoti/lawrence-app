export type AppEventType =
  | 'MemberCreated'
  | 'MemberUpdated'
  | 'MemberActivated'
  | 'MemberDeactivated'
  | 'MemberMoved'
  | 'MemberExited'
  | 'MemberArchived'
  | 'MemberRestored'
  | 'SponsorChanged'
  | 'EarningCreated'
  | 'FinancialRequestCreated'
  | 'FinancialRequestApproved'
  | 'FinancialRequestRejected'
  | 'FinancialRequestDisputed'
  | 'GoalCompleted'
  | 'TaskCompleted'
  | 'ReportSubmitted'
  | 'RankChanged'
  | 'RankAchieved'
  | 'RankQualificationChanged'
  | 'RankQualificationEvaluated'
  | 'RankProgressUpdated'
  | 'ActivityReported'
  | 'EvidenceSubmitted'
  | 'EvidenceReviewed'
  | 'LedgerEntryPosted'
  | 'JournalTransactionPosted'
  | 'FinancialAccountCreated'
  | 'PaymentRequestCreated'
  | 'PaymentRequestApproved'
  | 'PaymentRequestRejected'
  | 'PaymentRequestDisputed'
  | 'FinancialAdjustmentPosted'
  | 'FinancialPeriodClosed'
  | 'LeadCreated'
  | 'LeadUpdated'
  | 'LeadAssigned'
  | 'LeadStageChanged'
  | 'LeadConverted'
  | 'OpportunityCreated'
  | 'OpportunityWon'
  | 'OpportunityLost'
  | 'FollowUpCreated'
  | 'FollowUpCompleted'
  | 'AppointmentCreated'
  | 'LeadMerged'
  | 'SystemSettingChanged'
  | 'UserLoggedIn'
  | 'PermissionChanged'
  | 'CommunityPostCreated'
  | 'CommunityPostCommented'
  | 'CommunityPostReacted'
  | 'MemberMentioned'
  | 'PrivateMessageSent'
  | 'PrivateMessageRead'
  | 'TrainingAssigned'
  | 'TrainingStarted'
  | 'TrainingCompleted'
  | 'TrainingOverdue'
  | 'LeadershipAttentionTriggered'
  | 'CompensationRunCreated'
  | 'CompensationCalculated'
  | 'CompensationApproved'
  | 'CompensationPosted'
  | 'CompensationAdjusted'
  | 'EarningCalculated'
  | 'EarningPosted'
  | 'ClientHealthChanged'
  | 'RetentionCaseCreated'
  | 'RetentionCaseResolved'
  | 'RenewalCreated'
  | 'RenewalUpdated'
  | 'RenewalCompleted'
  | 'RenewalDeclined'
  | 'ExpansionOpportunityCreated'
  | 'ClientTouchpointCreated'
  | 'AutomationTriggered'
  | 'AutomationStarted'
  | 'AutomationStepCompleted'
  | 'AutomationCompleted'
  | 'AutomationFailed'
  | 'AutomationRetryScheduled'
  | 'AutomationApprovalRequired'
  | 'NotificationDispatched'
  | 'NotificationDelivered'
  | 'NotificationFailed'
  | 'NotificationBounced'
  | 'NotificationSuppressed'
  | 'CampaignStarted'
  | 'CampaignCompleted'
  | 'AiConversationCreated'
  | 'AiPromptSubmitted'
  | 'AiResponseGenerated'
  | 'AiInsightGenerated'
  | 'AiRecommendationApplied'
  | 'AiCoachingSessionCompleted'
  | 'AiQuotaExceeded'
  | 'SecurityEventRecorded'
  | 'SecurityIncidentCreated'
  | 'SecurityIncidentResolved'
  | 'AccessReviewCreated'
  | 'AccessRevoked'
  | 'ComplianceControlAtRisk'
  | 'ComplianceEvidenceExpired'
  | 'SecurityRiskCreated'
  | 'SecurityRiskResolved'
  | 'OperationalIncidentCreated'
  | 'OperationalIncidentResolved'
  | 'AnomalyDetected'
  | 'IntegrationConnectionFailed'
  | 'WebhookSignatureFailed'
  | 'IntegrationCredentialFailure'
  | 'IntegrationRateLimitExceeded'
  | 'IntegrationDeadLetterCreated'
  | 'IntegrationEndpointBlocked'
  | 'IntegrationJobCreated'
  | 'IntegrationJobCompleted'
  | 'IntegrationJobFailed'
  | 'OutboundWebhookDispatched'
  | 'BackupCompleted'
  | 'BackupFailed'
  | 'BackupVerificationFailed'
  | 'RecoveryStarted'
  | 'RecoveryStepFailed'
  | 'RecoveryCompleted'
  | 'RecoveryFailed'
  | 'RecoveryDrillCompleted'
  | 'RpoViolationDetected'
  | 'RtoViolationDetected'
  | 'DependencyFailureDetected'
  | 'ResilienceIncidentCreated'
  | 'ResilienceIncidentResolved'
  | 'DocumentCreated'
  | 'DocumentUpdated'
  | 'DocumentVersionCreated'
  | 'DocumentApproved'
  | 'DocumentRejected'
  | 'DocumentArchived'
  | 'DocumentRestored'
  | 'DocumentDeleted'
  | 'DocumentShared'
  | 'DocumentShareRevoked'
  | 'DocumentAccessDenied'
  | 'DocumentRetentionDue'
  | 'DocumentRetentionExecuted'
  | 'LegalHoldPlaced'
  | 'LegalHoldReleased'
  | 'KnowledgePublished'
  | 'KnowledgeArchived';

export interface AppEvent<T = Record<string, any>> {
  id: string;
  type: AppEventType;
  actorId?: string;
  payload: T;
  timestamp: Date;
}

type EventHandler<T = any> = (event: AppEvent<T>) => void | Promise<void>;

class ApplicationEventBus {
  private handlers: Map<AppEventType, Set<EventHandler>> = new Map();

  subscribe<T = any>(eventType: AppEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  async publish<T = any>(type: AppEventType, payload: T, actorId?: string): Promise<AppEvent<T>> {
    const event: AppEvent<T> = {
      id: crypto.randomUUID(),
      type,
      actorId,
      payload,
      timestamp: new Date(),
    };

    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      for (const handler of Array.from(typeHandlers)) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`[EventBus] Error handling event ${type}:`, error);
        }
      }
    }

    return event;
  }
}

export const eventBus = new ApplicationEventBus();
export const EventBus = {
  publish: (evtOrType: any, payload?: any, actorId?: any) => {
    if (typeof evtOrType === 'object' && evtOrType.type) {
      return eventBus.publish(evtOrType.type, evtOrType.payload, evtOrType.actorId);
    }
    return eventBus.publish(evtOrType, payload, actorId);
  },
  subscribe: eventBus.subscribe.bind(eventBus),
};
