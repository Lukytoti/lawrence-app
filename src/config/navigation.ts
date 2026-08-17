export interface NavItemConfig {
  id: string;
  label: string;
  iconName: string;
  href: string;
  group: string;
  requiredPermission?: string;
  badge?: string;
  featureFlag?: string;
}

export interface NavGroupConfig {
  id: string;
  label: string;
  items: NavItemConfig[];
}

export const NAVIGATION_CONFIG: NavGroupConfig[] = [
  {
    id: 'command-center',
    label: 'COMMAND CENTER',
    items: [
      { id: 'overview', label: 'Overview', iconName: 'LayoutDashboard', href: '/overview', group: 'command-center' },
      { id: 'cmd-center', label: 'Command Hub', iconName: 'Activity', href: '/command-center', group: 'command-center', badge: 'Hub' },
      { id: 'search', label: 'Global Search', iconName: 'Compass', href: '/search', group: 'command-center' },
      { id: 'health', label: 'System Health', iconName: 'Activity', href: '/command-center/health', group: 'command-center' },
      { id: 'alerts', label: 'Alert Center', iconName: 'ShieldAlert', href: '/command-center/alerts', group: 'command-center' },
      { id: 'my-day', label: 'My Day', iconName: 'Sun', href: '/my-day', group: 'command-center', badge: 'Today' },
      { id: 'inbox', label: 'Inbox', iconName: 'Inbox', href: '/inbox', group: 'command-center' },
    ],
  },
  {
    id: 'network',
    label: 'NETWORK',
    items: [
      { id: 'org', label: 'Organization', iconName: 'GitFork', href: '/network/organization', group: 'network', requiredPermission: 'org:read' },
      { id: 'members', label: 'Members', iconName: 'Users', href: '/network/members', group: 'network', requiredPermission: 'users:read' },
      { id: 'ranks', label: 'Ranks', iconName: 'Award', href: '/network/ranks', group: 'network', requiredPermission: 'org:read' },
      { id: 'performance', label: 'Performance', iconName: 'TrendingUp', href: '/network/performance', group: 'network', requiredPermission: 'org:read' },
    ],
  },
  {
    id: 'productivity',
    label: 'PRODUCTIVITY',
    items: [
      { id: 'tasks', label: 'Tasks', iconName: 'CheckSquare', href: '/productivity/tasks', group: 'productivity', requiredPermission: 'tasks:read' },
      { id: 'activities', label: 'Activities', iconName: 'Activity', href: '/productivity/activities', group: 'productivity', requiredPermission: 'tasks:read' },
      { id: 'goals', label: 'Goals', iconName: 'Target', href: '/productivity/goals', group: 'productivity' },
      { id: 'reports', label: 'Reports', iconName: 'FileText', href: '/productivity/reports', group: 'productivity', requiredPermission: 'reports:read' },
    ],
  },
  {
    id: 'learning',
    label: 'LEARNING',
    items: [
      { id: 'books', label: 'Books', iconName: 'BookOpen', href: '/learning/books', group: 'learning' },
      { id: 'training', label: 'Training', iconName: 'GraduationCap', href: '/learning/training', group: 'learning' },
      { id: 'challenges', label: 'Challenges', iconName: 'Zap', href: '/learning/challenges', group: 'learning' },
    ],
  },
  {
    id: 'business',
    label: 'BUSINESS',
    items: [
      { id: 'prospects', label: 'Prospects', iconName: 'UserPlus', href: '/business/prospects', group: 'business' },
      { id: 'clients', label: 'Clients', iconName: 'Briefcase', href: '/business/clients', group: 'business' },
      { id: 'projects', label: 'Projects', iconName: 'FolderKanban', href: '/business/projects', group: 'business' },
      { id: 'outsourcing', label: 'Outsourcing', iconName: 'Share2', href: '/business/outsourcing', group: 'business' },
    ],
  },
  {
    id: 'finance',
    label: 'FINANCE',
    items: [
      { id: 'earnings', label: 'Earnings', iconName: 'DollarSign', href: '/finance/earnings', group: 'finance', requiredPermission: 'finance:read_own' },
      { id: 'requests', label: 'Requests', iconName: 'CreditCard', href: '/finance/requests', group: 'finance', requiredPermission: 'finance:read_own' },
      { id: 'transactions', label: 'Transactions', iconName: 'Receipt', href: '/finance/transactions', group: 'finance', requiredPermission: 'finance:read_own' },
    ],
  },
  {
    id: 'community',
    label: 'COMMUNITY',
    items: [
      { id: 'feed', label: 'Feed', iconName: 'MessageSquare', href: '/community/feed', group: 'community' },
      { id: 'messages', label: 'Messages', iconName: 'Mail', href: '/community/messages', group: 'community' },
      { id: 'announcements', label: 'Announcements', iconName: 'Megaphone', href: '/community/announcements', group: 'community' },
    ],
  },
  {
    id: 'leadership',
    label: 'LEADERSHIP',
    items: [
      { id: 'coaching', label: 'Coaching', iconName: 'Compass', href: '/leadership/coaching', group: 'leadership' },
      { id: 'one-on-ones', label: 'One-on-Ones', iconName: 'UserCheck', href: '/leadership/one-on-ones', group: 'leadership' },
      { id: 'recognition', label: 'Recognition', iconName: 'Star', href: '/leadership/recognition', group: 'leadership' },
    ],
  },
  {
    id: 'admin',
    label: 'ADMIN',
    items: [
      { id: 'admin-plans', label: 'Plans & Rules', iconName: 'Award', href: '/admin/plans', group: 'admin', requiredPermission: 'network:plans:read' },
      { id: 'admin-users', label: 'Users', iconName: 'UserCog', href: '/admin/users', group: 'admin', requiredPermission: 'users:read' },
      { id: 'admin-permissions', label: 'Permissions', iconName: 'ShieldAlert', href: '/admin/permissions', group: 'admin', requiredPermission: 'roles:manage' },
      { id: 'admin-settings', label: 'Settings', iconName: 'Settings', href: '/admin/settings', group: 'admin', requiredPermission: 'settings:read' },
      { id: 'admin-governance', label: 'Governance & Security', iconName: 'ShieldCheck', href: '/governance', group: 'admin', requiredPermission: 'governance:read_own' },
      { id: 'admin-integrations', label: 'Integrations Gateway', iconName: 'Share2', href: '/integrations', group: 'admin', requiredPermission: 'integrations:read_own' },
      { id: 'admin-resilience', label: 'Resilience & DR', iconName: 'ShieldAlert', href: '/resilience', group: 'admin', requiredPermission: 'resilience:read_own' },
      { id: 'admin-documents', label: 'Documents & Knowledge', iconName: 'FileText', href: '/documents', group: 'admin', requiredPermission: 'documents:read_own' },
      { id: 'admin-audit', label: 'Audit Logs', iconName: 'ScrollText', href: '/admin/audit', group: 'admin', requiredPermission: 'audit:read' },
    ],
  },
];
