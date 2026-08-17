export type TriggerType = 'EVENT' | 'SCHEDULE' | 'CONDITION' | 'MANUAL';
export type StepType =
  | 'CONDITION'
  | 'ACTION'
  | 'DELAY'
  | 'NOTIFICATION'
  | 'TASK'
  | 'CRM_ACTION'
  | 'RETENTION_ACTION'
  | 'WEBHOOK'
  | 'EVENT';

export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'CANCELLED';
export type StepExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED' | 'FAILED' | 'RETRYING';
export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'contains'
  | 'in'
  | 'notIn'
  | 'exists'
  | 'isEmpty';

export interface ConditionRule {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface ConditionGroup {
  logicalOperator: 'AND' | 'OR';
  rules: (ConditionRule | ConditionGroup)[];
}

export interface CreateWorkflowInput {
  workflowCode: string;
  name: string;
  description?: string;
  domain?: string;
  triggerType?: TriggerType;
  createdById: string;
}

export interface CreateStepInput {
  workflowId: string;
  sequence: number;
  type: StepType;
  configurationJson: string | object;
}

export interface ExecuteWorkflowInput {
  workflowId: string;
  triggerType: TriggerType;
  triggerEvent?: string;
  correlationId?: string;
  idempotencyKey: string;
  contextPayload?: Record<string, any>;
  actorUserId?: string;
}

export interface StepExecutionResult {
  stepId: string;
  sequence: number;
  status: StepExecutionStatus;
  output?: any;
  error?: string;
}
