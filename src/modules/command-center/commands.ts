import { CommandItem } from './types';
import { hasPermission } from '@/lib/rbac';
import { isSuperAdminUser } from './permissions';

export const COMMAND_REGISTRY: CommandItem[] = [
  // Search Commands
  { id: 'cmd-search-client', code: 'SEARCH_CLIENT', label: 'Search Client', category: 'SEARCH', iconName: 'Search', targetRoute: '/search?domain=CLIENTS' },
  { id: 'cmd-search-member', code: 'SEARCH_MEMBER', label: 'Search Member', category: 'SEARCH', iconName: 'Users', targetRoute: '/search?domain=MEMBERS' },
  { id: 'cmd-search-invoice', code: 'SEARCH_INVOICE', label: 'Search Invoice', category: 'SEARCH', iconName: 'Receipt', targetRoute: '/search?domain=INVOICES' },

  // Creation Commands (Quick Actions)
  { id: 'cmd-create-task', code: 'CREATE_TASK', label: 'Create Task', category: 'CREATE', iconName: 'CheckSquare', requiredPermission: 'tasks:manage', actionHandler: 'PROMPT_04_TASK' },
  { id: 'cmd-create-opp', code: 'CREATE_OPPORTUNITY', label: 'Create CRM Opportunity', category: 'CREATE', iconName: 'Target', requiredPermission: 'crm:create', actionHandler: 'PROMPT_06_CRM' },
  { id: 'cmd-create-invoice', code: 'CREATE_INVOICE', label: 'Create Invoice', category: 'CREATE', iconName: 'Receipt', requiredPermission: 'billing:create', actionHandler: 'PROMPT_11_BILLING' },
  { id: 'cmd-create-retention-case', code: 'CREATE_RETENTION_CASE', label: 'Create Retention Case', category: 'CREATE', iconName: 'ShieldAlert', requiredPermission: 'retention:create', actionHandler: 'PROMPT_12_RETENTION' },
  { id: 'cmd-send-notification', code: 'SEND_NOTIFICATION', label: 'Send Multi-Channel Notification', category: 'CREATE', iconName: 'Send', requiredPermission: 'notifications:send', actionHandler: 'PROMPT_14_NOTIFICATIONS' },

  // Navigation Commands
  { id: 'cmd-view-overdue-inv', code: 'VIEW_OVERDUE_INVOICES', label: 'View Overdue Invoices', category: 'NAVIGATE', iconName: 'AlertCircle', requiredPermission: 'billing:read_own', targetRoute: '/billing/invoices?status=OVERDUE' },
  { id: 'cmd-view-at-risk-clients', code: 'VIEW_AT_RISK_CLIENTS', label: 'View At-Risk Clients', category: 'NAVIGATE', iconName: 'ShieldAlert', requiredPermission: 'retention:read_own', targetRoute: '/retention/cases' },
  { id: 'cmd-view-renewals', code: 'VIEW_RENEWALS', label: 'View Upcoming Renewals', category: 'NAVIGATE', iconName: 'RefreshCw', requiredPermission: 'retention:read_own', targetRoute: '/retention/renewals' },
  { id: 'cmd-view-projects-risk', code: 'VIEW_PROJECTS_AT_RISK', label: 'View Projects at Risk', category: 'NAVIGATE', iconName: 'FolderKanban', requiredPermission: 'projects:read_own', targetRoute: '/projects' },
  { id: 'cmd-view-today-tasks', code: 'VIEW_TODAY_TASKS', label: 'View Today Tasks', category: 'NAVIGATE', iconName: 'Sun', targetRoute: '/my-day' },
  { id: 'cmd-view-automation', code: 'OPEN_AUTOMATION_CENTER', label: 'Open Automation Workflows', category: 'NAVIGATE', iconName: 'Zap', requiredPermission: 'automation:read_own', targetRoute: '/automation' },
  { id: 'cmd-view-notifications', code: 'OPEN_NOTIFICATION_CENTER', label: 'Open Notification Center', category: 'NAVIGATE', iconName: 'Bell', requiredPermission: 'notifications:read_own', targetRoute: '/notifications' },
  { id: 'cmd-view-finance', code: 'VIEW_FINANCIAL_DASHBOARD', label: 'View Financial Ledger', category: 'NAVIGATE', iconName: 'DollarSign', requiredPermission: 'finance:read_own', targetRoute: '/finance/earnings' },
  { id: 'cmd-view-analytics', code: 'VIEW_EXECUTIVE_ANALYTICS', label: 'View Executive Analytics', category: 'NAVIGATE', iconName: 'BarChart3', requiredPermission: 'analytics:read_own', targetRoute: '/analytics' },
  { id: 'cmd-view-health', code: 'OPEN_SYSTEM_HEALTH', label: 'Open System Health Monitoring', category: 'NAVIGATE', iconName: 'Activity', requiredPermission: 'settings:read', targetRoute: '/command-center/health' },
  { id: 'cmd-view-audit', code: 'OPEN_AUDIT_LOGS', label: 'Open System Audit Logs', category: 'NAVIGATE', iconName: 'ScrollText', requiredPermission: 'audit:read', targetRoute: '/admin/audit' },

  // AI Commands
  { id: 'cmd-ask-ai', code: 'ASK_AI', label: 'Ask Executive AI Co-Pilot', category: 'AI', iconName: 'Sparkles', actionHandler: 'PROMPT_15_AI', targetRoute: '/ai/chat' },
];

export async function getAvailableCommands(userId: string): Promise<CommandItem[]> {
  const isSuper = await isSuperAdminUser(userId);
  if (isSuper) return COMMAND_REGISTRY;

  const available: CommandItem[] = [];
  for (const cmd of COMMAND_REGISTRY) {
    if (!cmd.requiredPermission) {
      available.push(cmd);
    } else {
      const allowed = await hasPermission(userId, cmd.requiredPermission);
      if (allowed) available.push(cmd);
    }
  }
  return available;
}
