export type SearchDomain =
  | 'MEMBERS'
  | 'ORGANIZATIONS'
  | 'CRM_LEADS'
  | 'CRM_OPPORTUNITIES'
  | 'CLIENTS'
  | 'PROJECTS'
  | 'CONTRACTS'
  | 'INVOICES'
  | 'PAYMENTS'
  | 'RETENTION_CASES'
  | 'RENEWALS'
  | 'TASKS'
  | 'WORKFLOWS'
  | 'EXECUTIONS'
  | 'NOTIFICATIONS'
  | 'AI_CONVERSATIONS'
  | 'COMMUNITY';

export interface SearchResultItem {
  id: string;
  entityType: string;
  title: string;
  subtitle?: string;
  status?: string;
  relevance: number;
  domain: SearchDomain;
  route: string;
  permittedActions: string[];
  metadata?: Record<string, any>;
}

export interface SearchQueryInput {
  query: string;
  domain?: SearchDomain;
  limit?: number;
  offset?: number;
}

export interface SearchQueryOutput {
  results: SearchResultItem[];
  totalCount: number;
  query: string;
  domain?: SearchDomain;
  limit: number;
  offset: number;
}

export interface CommandItem {
  id: string;
  code: string;
  label: string;
  category: 'SEARCH' | 'CREATE' | 'NAVIGATE' | 'ACTION' | 'AI';
  description?: string;
  iconName?: string;
  requiredPermission?: string;
  targetRoute?: string;
  actionHandler?: string;
}

export interface WorkQueueItem {
  id: string;
  sourceDomain: 'PRODUCTIVITY' | 'RETENTION' | 'BILLING' | 'CRM' | 'AUTOMATION' | 'NOTIFICATIONS' | 'AI' | 'PROJECTS';
  sourceId: string;
  title: string;
  subtitle?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
  ownerId?: string;
  status: string;
  deepLinkRoute: string;
  recommendedAction: string;
}

export interface ActivityTimelineItem {
  id: string;
  timestamp: Date;
  actorId?: string;
  actorName?: string;
  event: string;
  domain: string;
  entityType: string;
  entityId: string;
  status?: string;
  route?: string;
  metadata?: Record<string, any>;
}

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'ERROR' | 'UNKNOWN';

export interface ComponentHealthResult {
  component: string;
  status: HealthStatus;
  durationMs: number;
  lastCheckTime: Date;
  message?: string;
  dependencyInfo?: string;
  remediationHint?: string;
}

export interface SystemHealthReport {
  overallStatus: HealthStatus;
  calculatedAt: Date;
  durationMs: number;
  components: ComponentHealthResult[];
}

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface ExecutiveAlert {
  id: string;
  severity: AlertSeverity;
  domain: string;
  title: string;
  message: string;
  actionRoute?: string;
  createdAt: Date;
  sourceEntityId?: string;
}

export interface ExecutiveKpiSummary {
  people: {
    totalMembers: number;
    activeMembers: number;
    orgCount: number;
    leadershipActivityCount: number;
  };
  productivity: {
    tasksDueToday: number;
    overdueTasks: number;
    completedTasks: number;
    workQueueCount: number;
  };
  crm: {
    openOpportunitiesCount: number;
    pipelineValueTotal: number;
    newLeadsCount: number;
  };
  projects: {
    activeProjectsCount: number;
    projectsAtRiskCount: number;
    overdueMilestonesCount: number;
  };
  billing: {
    outstandingInvoicesCount: number;
    overdueInvoicesCount: number;
    totalUnpaidAmount: number;
  };
  retention: {
    healthyClientsCount: number;
    atRiskClientsCount: number;
    upcomingRenewalsCount: number;
  };
  automation: {
    activeWorkflowsCount: number;
    executionsTodayCount: number;
    failedExecutionsCount: number;
  };
  notifications: {
    pendingMessagesCount: number;
    failedDeliveriesCount: number;
    suppressedCount: number;
  };
  ai: {
    conversationsCount: number;
    insightsCount: number;
    promptsUsedToday: number;
  };
  finance: {
    readOnlyStatus: string;
  };
}

export interface SavedViewDto {
  id: string;
  userId: string;
  name: string;
  description?: string;
  configurationJson: string;
  isDefault: boolean;
  createdAt: Date;
}
