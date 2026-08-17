import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting NeoLife Business Productivity & Leadership OS seed...');

  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);

  // 1. Seed Permissions
  const permissionsData = [
    { code: 'users:read', module: 'users', description: 'View user profiles' },
    { code: 'users:write', module: 'users', description: 'Create and update users' },
    { code: 'users:delete', module: 'users', description: 'Delete users' },
    { code: 'roles:read', module: 'rbac', description: 'View roles' },
    { code: 'roles:write', module: 'rbac', description: 'Manage roles and permissions' },
    { code: 'org:read', module: 'org', description: 'View organization structure' },
    { code: 'org:write', module: 'org', description: 'Manage organization relationships' },
    { code: 'network:members:read', module: 'network', description: 'View network members' },
    { code: 'network:members:write', module: 'network', description: 'Manage network members' },
    { code: 'network:organization:read', module: 'network', description: 'Explore network organization tree' },
    { code: 'network:ranks:read', module: 'network', description: 'View network ranks' },
    { code: 'network:qualification:read', module: 'network', description: 'View rank qualifications' },
    { code: 'productivity:read', module: 'productivity', description: 'View activity dashboard and daily instances' },
    { code: 'productivity:manage', module: 'productivity', description: 'Manage activity instances and goals' },
    { code: 'tasks:read', module: 'productivity', description: 'View tasks' },
    { code: 'tasks:manage', module: 'productivity', description: 'Create and manage tasks' },
    { code: 'reports:read', module: 'productivity', description: 'View productivity reports' },
    { code: 'reports:manage', module: 'productivity', description: 'Submit activity reports' },
    { code: 'finance:read_all', module: 'finance', description: 'View all financial transactions and balances' },
    { code: 'finance:read_own', module: 'finance', description: 'View own financial earnings and balances' },
    { code: 'finance:payout:request', module: 'finance', description: 'Request payout' },
    { code: 'finance:payout:approve', module: 'finance', description: 'Approve payout requests' },
    { code: 'finance:adjust', module: 'finance', description: 'Issue ledger adjustments' },
    { code: 'finance:period:manage', module: 'finance', description: 'Manage and close financial periods' },
    { code: 'crm:read_own', module: 'crm', description: 'View own leads and prospects' },
    { code: 'crm:read_team', module: 'crm', description: 'View team leads and prospects' },
    { code: 'crm:read_all', module: 'crm', description: 'View all leads and prospects across organization' },
    { code: 'crm:create', module: 'crm', description: 'Create new leads and prospects' },
    { code: 'crm:update', module: 'crm', description: 'Update lead and prospect details' },
    { code: 'crm:delete', module: 'crm', description: 'Archive or delete leads' },
    { code: 'crm:assign', module: 'crm', description: 'Assign leads to sales representatives' },
    { code: 'crm:manage_pipelines', module: 'crm', description: 'Administer CRM pipelines and stage rules' },
    { code: 'crm:manage_tags', module: 'crm', description: 'Manage prospect tag taxonomy' },
    { code: 'crm:manage_sources', module: 'crm', description: 'Manage lead source options' },
    { code: 'crm:manage_scoring', module: 'crm', description: 'Manage lead scoring rules' },
    { code: 'crm:import', module: 'crm', description: 'Import prospect records via CSV' },
    { code: 'crm:export', module: 'crm', description: 'Export prospect records' },
    { code: 'crm:convert', module: 'crm', description: 'Convert prospects to NetworkMembers or Digital Clients' },
    { code: 'crm:manage_followups', module: 'crm', description: 'Schedule and manage follow-ups' },
    { code: 'crm:manage_appointments', module: 'crm', description: 'Schedule and manage appointments' },
    // Module 07 — Community & Communication Permissions
    { code: 'community:read', module: 'community', description: 'View community feed posts and comments' },
    { code: 'community:post', module: 'community', description: 'Create community posts' },
    { code: 'community:comment', module: 'community', description: 'Add comments and replies' },
    { code: 'community:moderate', module: 'community', description: 'Archive or moderate community content' },
    { code: 'community:manage', module: 'community', description: 'Manage community channels and settings' },
    { code: 'community:messages', module: 'community', description: 'Use private messaging' },
    { code: 'community:messages:manage', module: 'community', description: 'Administer message channels' },
    { code: 'community:training:read', module: 'community', description: 'View training modules and assignments' },
    { code: 'community:training:create', module: 'community', description: 'Create training modules' },
    { code: 'community:training:assign', module: 'community', description: 'Assign training modules to members or teams' },
    { code: 'community:training:review', module: 'community', description: 'Review training progress and evidence submissions' },
    { code: 'community:analytics:read', module: 'community', description: 'View engagement and leadership attention analytics' },
    // Module 08 — Compensation Engine Permissions
    { code: 'finance:compensation:read', module: 'compensation', description: 'View compensation calculation runs and rules' },
    { code: 'finance:compensation:calculate', module: 'compensation', description: 'Initiate compensation calculation runs and preview modes' },
    { code: 'finance:compensation:approve', module: 'compensation', description: 'Approve calculated compensation runs' },
    { code: 'finance:compensation:post', module: 'compensation', description: 'Post approved compensation runs to double-entry ledger' },
    { code: 'finance:compensation:adjust', module: 'compensation', description: 'Create offsetting compensation adjustments' },
    { code: 'finance:compensation:rules:read', module: 'compensation', description: 'Inspect data-driven compensation rules' },
    { code: 'finance:compensation:rules:manage', module: 'compensation', description: 'Manage compensation rule configurations' },
    // Module 09 — Executive Intelligence & Analytics Permissions
    { code: 'analytics:read_own', module: 'analytics', description: 'View own analytics metrics' },
    { code: 'analytics:read_team', module: 'analytics', description: 'View team analytics metrics' },
    { code: 'analytics:read_all', module: 'analytics', description: 'View global executive analytics metrics' },
    { code: 'analytics:financial', module: 'analytics', description: 'View financial analytics' },
    { code: 'analytics:compensation', module: 'analytics', description: 'View compensation analytics' },
    { code: 'analytics:manage', module: 'analytics', description: 'Manage analytics snapshots and settings' },
    { code: 'analytics:export', module: 'analytics', description: 'Export analytics reports' },
    // Module 10 — Digital Client, Project & Service Delivery Permissions
    { code: 'projects:read_own', module: 'projects', description: 'View own assigned projects' },
    { code: 'projects:read_team', module: 'projects', description: 'View team projects' },
    { code: 'projects:read_all', module: 'projects', description: 'View all projects across organization' },
    { code: 'projects:create', module: 'projects', description: 'Create digital projects' },
    { code: 'projects:update', module: 'projects', description: 'Update project details and status' },
    { code: 'projects:assign', module: 'projects', description: 'Assign project managers and tasks' },
    { code: 'projects:manage_services', module: 'projects', description: 'Manage digital service catalog' },
    { code: 'projects:manage_templates', module: 'projects', description: 'Manage project templates' },
    { code: 'projects:manage_milestones', module: 'projects', description: 'Create and manage project milestones' },
    { code: 'projects:manage_deliverables', module: 'projects', description: 'Manage project deliverables' },
    { code: 'projects:approve', module: 'projects', description: 'Approve deliverable client reviews' },
    { code: 'projects:client_portal', module: 'projects', description: 'Manage client portal access' },
    { code: 'projects:admin', module: 'projects', description: 'Full project administration' },

    // Module 11 Permissions (14)
    { code: 'billing:read_own', module: 'billing', description: 'Read own client billing records' },
    { code: 'billing:read_team', module: 'billing', description: 'Read team billing records' },
    { code: 'billing:read_all', module: 'billing', description: 'Read all billing records' },
    { code: 'billing:create', module: 'billing', description: 'Create client billing records and contracts' },
    { code: 'billing:update', module: 'billing', description: 'Update billing records and contracts' },
    { code: 'billing:issue', module: 'billing', description: 'Issue invoices' },
    { code: 'billing:cancel', module: 'billing', description: 'Cancel invoices and contracts' },
    { code: 'billing:manage_contracts', module: 'billing', description: 'Manage client contracts' },
    { code: 'billing:manage_schedules', module: 'billing', description: 'Manage billing schedules' },
    { code: 'billing:record_payment', module: 'billing', description: 'Record client payments' },
    { code: 'billing:reconcile', module: 'billing', description: 'Reconcile payments with financial ledger' },
    { code: 'billing:refund', module: 'billing', description: 'Process payment refunds' },
    { code: 'billing:export', module: 'billing', description: 'Export billing reports' },
    { code: 'billing:admin', module: 'billing', description: 'Full billing administration' },

    // Module 12 Permissions (13)
    { code: 'retention:read_own', module: 'retention', description: 'Read own client retention records' },
    { code: 'retention:read_team', module: 'retention', description: 'Read team retention records' },
    { code: 'retention:read_all', module: 'retention', description: 'Read all client retention records' },
    { code: 'retention:create', module: 'retention', description: 'Create retention records and touchpoints' },
    { code: 'retention:update', module: 'retention', description: 'Update retention records and success plans' },
    { code: 'retention:assign', module: 'retention', description: 'Assign retention cases and renewals' },
    { code: 'retention:manage_cases', module: 'retention', description: 'Manage retention cases' },
    { code: 'retention:manage_renewals', module: 'retention', description: 'Manage contract renewals' },
    { code: 'retention:manage_success_plans', module: 'retention', description: 'Manage client success plans' },
    { code: 'retention:manage_health', module: 'retention', description: 'Manage client health scoring' },
    { code: 'retention:manage_expansion', module: 'retention', description: 'Manage expansion opportunities' },
    { code: 'retention:admin', module: 'retention', description: 'Full retention administration' },
    { code: 'retention:export', module: 'retention', description: 'Export retention reports' },

    // Module 13 Permissions (12)
    { code: 'automation:read_own', module: 'automation', description: 'Read own workflow automation records' },
    { code: 'automation:read_team', module: 'automation', description: 'Read team workflow automation records' },
    { code: 'automation:read_all', module: 'automation', description: 'Read all workflow automation records' },
    { code: 'automation:create', module: 'automation', description: 'Create automation workflows' },
    { code: 'automation:update', module: 'automation', description: 'Update automation workflows and steps' },
    { code: 'automation:activate', module: 'automation', description: 'Activate automation workflows' },
    { code: 'automation:pause', module: 'automation', description: 'Pause or archive automation workflows' },
    { code: 'automation:execute', module: 'automation', description: 'Manually execute automation workflows' },
    { code: 'automation:manage_rules', module: 'automation', description: 'Manage automation rules and conditions' },
    { code: 'automation:manage_schedules', module: 'automation', description: 'Manage recurring automation schedules' },
    { code: 'automation:admin', module: 'automation', description: 'Full automation engine administration' },
    { code: 'automation:export', module: 'automation', description: 'Export automation execution reports' },

    // Module 14 Permissions (14)
    { code: 'notifications:read_own', module: 'notifications', description: 'Read own notification records' },
    { code: 'notifications:read_team', module: 'notifications', description: 'Read team notification records' },
    { code: 'notifications:read_all', module: 'notifications', description: 'Read all system notification records' },
    { code: 'notifications:create', module: 'notifications', description: 'Create notification messages and drafts' },
    { code: 'notifications:send', module: 'notifications', description: 'Send multi-channel notifications' },
    { code: 'notifications:manage_templates', module: 'notifications', description: 'Manage notification templates' },
    { code: 'notifications:manage_campaigns', module: 'notifications', description: 'Manage notification campaigns' },
    { code: 'notifications:manage_preferences', module: 'notifications', description: 'Manage communication preferences' },
    { code: 'notifications:manage_suppressions', module: 'notifications', description: 'Manage recipient suppression lists' },
    { code: 'notifications:manage_providers', module: 'notifications', description: 'Configure notification providers' },
    { code: 'notifications:admin', module: 'notifications', description: 'Full notification engine administration' },
    { code: 'notifications:export', module: 'notifications', description: 'Export delivery tracking reports' },
    { code: 'notifications:analytics', module: 'notifications', description: 'Access executive notification analytics' },
    { code: 'notifications:audit', module: 'notifications', description: 'Access notification audit logs' },

    // Module 15 AI Permissions (14)
    { code: 'ai:read_own', module: 'ai', description: 'Read own AI conversations and insights' },
    { code: 'ai:read_team', module: 'ai', description: 'Read team AI insights and recommendations' },
    { code: 'ai:read_all', module: 'ai', description: 'Read all AI conversations, insights, and audit logs' },
    { code: 'ai:chat', module: 'ai', description: 'Interact with AI Executive Co-Pilot' },
    { code: 'ai:generate_insights', module: 'ai', description: 'Trigger AI strategic insight generation' },
    { code: 'ai:manage_prompts', module: 'ai', description: 'Manage AI coaching prompts and templates' },
    { code: 'ai:manage_recommendations', module: 'ai', description: 'Manage and apply AI system recommendations' },
    { code: 'ai:manage_knowledge', module: 'ai', description: 'Manage AI knowledge base index' },
    { code: 'ai:manage_quotas', module: 'ai', description: 'Configure user AI prompt usage quotas' },
    { code: 'ai:admin', module: 'ai', description: 'Full AI engine administration and configuration' },
    { code: 'ai:export', module: 'ai', description: 'Export AI chat transcripts and insight reports' },
    { code: 'ai:analytics', module: 'ai', description: 'Access executive AI token usage and analytics' },
    { code: 'ai:audit', module: 'ai', description: 'Access AI audit logs and cost tracking' },
    { code: 'ai:coaching', module: 'ai', description: 'Access 1-on-1 AI Leadership Coaching Assistant' },

    // Module 18 Governance Permissions (12)
    { code: 'governance:read_own', module: 'governance', description: 'Read own governance dashboard' },
    { code: 'governance:read_team', module: 'governance', description: 'Read team governance dashboard' },
    { code: 'governance:read_all', module: 'governance', description: 'Read all platform governance records' },
    { code: 'governance:manage_security', module: 'governance', description: 'Manage security operations and events' },
    { code: 'governance:manage_incidents', module: 'governance', description: 'Manage security and operational incidents' },
    { code: 'governance:manage_access_reviews', module: 'governance', description: 'Manage access governance reviews' },
    { code: 'governance:manage_compliance', module: 'governance', description: 'Manage compliance controls and evidence' },
    { code: 'governance:manage_risks', module: 'governance', description: 'Manage security risk register' },
    { code: 'governance:manage_observability', module: 'governance', description: 'Manage system observability telemetry' },
    { code: 'governance:admin', module: 'governance', description: 'Full platform governance administration' },
    { code: 'governance:export', module: 'governance', description: 'Export governance and compliance reports' },
    { code: 'governance:audit', module: 'governance', description: 'Access audit trail integrity checks' },

    // Module 19 Integrations Permissions (16)
    { code: 'integrations:read_own', module: 'integrations', description: 'Read own integration records' },
    { code: 'integrations:read_team', module: 'integrations', description: 'Read team integration records' },
    { code: 'integrations:read_all', module: 'integrations', description: 'Read all system integration records' },
    { code: 'integrations:create', module: 'integrations', description: 'Create integrations and endpoints' },
    { code: 'integrations:update', module: 'integrations', description: 'Update integration configurations' },
    { code: 'integrations:activate', module: 'integrations', description: 'Activate integration adapters' },
    { code: 'integrations:pause', module: 'integrations', description: 'Pause integration execution' },
    { code: 'integrations:manage_connections', module: 'integrations', description: 'Manage connection credentials and environments' },
    { code: 'integrations:manage_webhooks', module: 'integrations', description: 'Manage webhook endpoints and secrets' },
    { code: 'integrations:manage_mappings', module: 'integrations', description: 'Manage entity and field mappings' },
    { code: 'integrations:manage_credentials', module: 'integrations', description: 'Manage API keys and secret references' },
    { code: 'integrations:execute', module: 'integrations', description: 'Trigger manual sync jobs' },
    { code: 'integrations:manage_dead_letters', module: 'integrations', description: 'Inspect, retry, or discard dead-letter items' },
    { code: 'integrations:admin', module: 'integrations', description: 'Full integration gateway engine administration' },
    { code: 'integrations:export', module: 'integrations', description: 'Export integration logs and metrics' },
    { code: 'integrations:audit', module: 'integrations', description: 'Access integration security audit trail' },

    // Module 20 Resilience Permissions (17)
    { code: 'resilience:read_own', module: 'resilience', description: 'Read own resilience dashboard' },
    { code: 'resilience:read_team', module: 'resilience', description: 'Read team resilience metrics' },
    { code: 'resilience:read_all', module: 'resilience', description: 'Read all platform resilience records' },
    { code: 'resilience:create', module: 'resilience', description: 'Create resilience policies and plans' },
    { code: 'resilience:update', module: 'resilience', description: 'Update resilience policies and plans' },
    { code: 'resilience:manage_backups', module: 'resilience', description: 'Manage backup plans and policies' },
    { code: 'resilience:execute_backup', module: 'resilience', description: 'Execute and trigger backups' },
    { code: 'resilience:verify_backup', module: 'resilience', description: 'Verify backup integrity and checksums' },
    { code: 'resilience:manage_recovery', module: 'resilience', description: 'Manage disaster recovery runbooks' },
    { code: 'resilience:execute_recovery', module: 'resilience', description: 'Execute disaster recovery operations' },
    { code: 'resilience:manage_continuity', module: 'resilience', description: 'Manage business continuity plans' },
    { code: 'resilience:manage_dependencies', module: 'resilience', description: 'Manage service dependency topology' },
    { code: 'resilience:manage_drills', module: 'resilience', description: 'Execute and manage recovery drills' },
    { code: 'resilience:manage_incidents', module: 'resilience', description: 'Manage resilience incidents' },
    { code: 'resilience:admin', module: 'resilience', description: 'Full platform resilience administration' },
    { code: 'resilience:export', module: 'resilience', description: 'Export resilience telemetry and runbooks' },
    { code: 'resilience:audit', module: 'resilience', description: 'Access resilience audit trail' },

    // Module 21 Document & Knowledge Permissions (19)
    { code: 'documents:read_own', module: 'documents', description: 'Read own documents and public knowledge' },
    { code: 'documents:read_team', module: 'documents', description: 'Read team documents and shared folders' },
    { code: 'documents:read_all', module: 'documents', description: 'Read all documents across the organization' },
    { code: 'documents:create', module: 'documents', description: 'Create and draft new documents' },
    { code: 'documents:update', module: 'documents', description: 'Update document metadata and attributes' },
    { code: 'documents:delete', module: 'documents', description: 'Delete non-held documents' },
    { code: 'documents:upload', module: 'documents', description: 'Upload document files and new versions' },
    { code: 'documents:download', module: 'documents', description: 'Download authorized document files' },
    { code: 'documents:share', module: 'documents', description: 'Generate document share tokens' },
    { code: 'documents:approve', module: 'documents', description: 'Review and approve document releases' },
    { code: 'documents:manage_folders', module: 'documents', description: 'Create and organize document folders' },
    { code: 'documents:manage_permissions', module: 'documents', description: 'Manage ACL permissions on documents' },
    { code: 'documents:manage_knowledge', module: 'documents', description: 'Manage knowledge base articles and collections' },
    { code: 'documents:publish_knowledge', module: 'documents', description: 'Publish authoritative knowledge entries' },
    { code: 'documents:manage_retention', module: 'documents', description: 'Configure document retention policies' },
    { code: 'documents:manage_legal_hold', module: 'documents', description: 'Place and release legal preservation holds' },
    { code: 'documents:admin', module: 'documents', description: 'Full document and knowledge system administration' },
    { code: 'documents:export', module: 'documents', description: 'Export document manifests and knowledge collections' },
    { code: 'documents:audit', module: 'documents', description: 'Access document activity audit logs' },
  ];

  const permissions: Record<string, any> = {};
  for (const item of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { code: item.code },
      update: { description: item.description, module: item.module },
      create: item,
    });
    permissions[item.code] = perm;
  }
  console.log(`✅ Created/updated ${Object.keys(permissions).length} permissions.`);

  // 2. Create System Roles
  const rolesData = [
    {
      name: 'SUPER_ADMIN',
      description: 'System owner with unrestricted administrative access',
      isSystem: true,
      permCodes: Object.keys(permissions),
    },
    {
      name: 'ADMIN',
      description: 'Operational administrator with management access',
      isSystem: true,
      permCodes: Object.keys(permissions),
    },
    {
      name: 'LEADER',
      description: 'Network marketing organizational leader',
      isSystem: true,
      permCodes: [
        'users:read', 'org:read', 'network:members:read', 'network:organization:read',
        'network:ranks:read', 'network:qualification:read',
        'productivity:read', 'productivity:manage', 'tasks:read', 'tasks:manage',
        'reports:read', 'reports:manage', 'finance:read_own',
        'crm:read_team', 'crm:create', 'crm:update', 'crm:convert', 'crm:manage_followups', 'crm:manage_appointments',
        'community:read', 'community:post', 'community:comment', 'community:messages',
        'community:training:read', 'community:training:assign', 'community:training:review', 'community:analytics:read',
        'finance:compensation:read', 'finance:compensation:rules:read',
        'analytics:read_own', 'analytics:read_team', 'analytics:export',
        'documents:read_own', 'documents:read_team', 'documents:create', 'documents:upload', 'documents:update', 'documents:share', 'documents:download', 'documents:approve', 'documents:manage_folders', 'documents:manage_knowledge', 'documents:export',
      ],
    },
    {
      name: 'TEAM_LEADER',
      description: 'Team activity supervisor',
      isSystem: true,
      permCodes: [
        'users:read', 'org:read', 'network:members:read', 'network:organization:read', 'network:ranks:read',
        'productivity:read', 'tasks:read', 'reports:read', 'finance:read_own',
        'crm:read_own', 'crm:create', 'crm:update', 'crm:manage_followups',
        'community:read', 'community:post', 'community:comment', 'community:messages',
        'community:training:read', 'community:training:assign',
        'finance:compensation:read',
        'analytics:read_own', 'analytics:read_team', 'analytics:export',
        'documents:read_own', 'documents:read_team', 'documents:create', 'documents:upload', 'documents:update', 'documents:share', 'documents:download', 'documents:manage_folders',
      ],
    },
    {
      name: 'MEMBER',
      description: 'Standard network organization member',
      isSystem: true,
      permCodes: [
        'productivity:read', 'tasks:read', 'reports:read', 'finance:read_own', 'network:members:read', 'network:ranks:read',
        'crm:read_own', 'crm:create', 'crm:update', 'crm:manage_followups',
        'community:read', 'community:post', 'community:comment', 'community:messages',
        'community:training:read',
        'analytics:read_own',
        'documents:read_own', 'documents:create', 'documents:upload', 'documents:update', 'documents:share', 'documents:download',
      ],
    },
  ];

  const roles: Record<string, any> = {};
  for (const item of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: item.name },
      update: { description: item.description, isSystem: item.isSystem },
      create: {
        name: item.name,
        description: item.description,
        isSystem: item.isSystem,
      },
    });
    roles[item.name] = role;

    const rolePermEntries = item.permCodes
      .map((code) => {
        const perm = permissions[code];
        return perm ? { roleId: role.id, permissionId: perm.id } : null;
      })
      .filter((entry): entry is { roleId: string; permissionId: string } => entry !== null);

    if (rolePermEntries.length > 0) {
      await prisma.rolePermission.createMany({
        data: rolePermEntries,
        skipDuplicates: true,
      });
    }
  }
  console.log(`✅ Created/updated ${Object.keys(roles).length} system roles.`);

  // 3. Seed Super Admin User (Oluwatobi)
  const adminUser = await prisma.user.upsert({
    where: { email: 'oluwatobi@lawrenceapp.internal' },
    update: { name: 'Oluwatobi' },
    create: {
      email: 'oluwatobi@lawrenceapp.internal',
      name: 'Oluwatobi',
      passwordHash,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'Oluwatobi',
          lastName: 'SuperAdmin',
          displayName: 'Oluwatobi (Super Admin)',
        },
      },
      networkMember: {
        create: {
          memberCode: 'NM-SUPER-001',
          status: 'ACTIVE',
        },
      },
    },
    include: { networkMember: true },
  });

  if (roles['SUPER_ADMIN']) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: roles['SUPER_ADMIN'].id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: roles['SUPER_ADMIN'].id,
      },
    });
  }

  console.log('✅ Super Admin user seeded: oluwatobi@lawrenceapp.internal');

  // Seed Compensation Rules for Active Plan Version
  const planVersion = await prisma.planVersion.findFirst({
    where: { status: 'ACTIVE' },
  });

  if (planVersion) {
    const defaultRules = [
      {
        code: 'SVB_RULES',
        name: 'Sales Volume Bonus (SVB) Rule',
        category: 'SVB',
        status: 'ACTIVE',
        priority: 1,
        configurationJson: JSON.stringify({
          monetaryFormulaBase: 'BV',
          description: 'Evaluates QPV against active SVBRateConfig and applies rate to qualifying BV volume',
        }),
        description: 'Verified Sales Volume Bonus rate evaluation',
      },
      {
        code: 'LDB_RULES',
        name: 'Leadership Development Bonus (LDB) Rule',
        category: 'LDB',
        status: 'UNCONFIGURED',
        priority: 2,
        configurationJson: null,
        description: 'Unconfigured Leadership Development Bonus rule (safely skips payout calculation)',
      },
      {
        code: 'NDB_RULES',
        name: 'Network Development Bonus (NDB) Rule',
        category: 'NDB',
        status: 'UNCONFIGURED',
        priority: 3,
        configurationJson: null,
        description: 'Unconfigured Network Development Bonus rule (safely skips payout calculation)',
      },
      {
        code: 'RANK_BONUS_DIRECTOR',
        name: 'Director Family Rank Achievement Bonus',
        category: 'RANK_BONUS',
        status: 'UNCONFIGURED',
        priority: 4,
        configurationJson: null,
        description: 'Unconfigured Rank Achievement Bonus rule',
      },
    ];

    for (const r of defaultRules) {
      await prisma.compensationRule.upsert({
        where: {
          planVersionId_code: {
            planVersionId: planVersion.id,
            code: r.code,
          },
        },
        update: {
          name: r.name,
          category: r.category,
          status: r.status,
          priority: r.priority,
          configurationJson: r.configurationJson,
          description: r.description,
        },
        create: {
          planVersionId: planVersion.id,
          code: r.code,
          name: r.name,
          category: r.category,
          status: r.status,
          priority: r.priority,
          configurationJson: r.configurationJson,
          description: r.description,
        },
      });
    }
    console.log('✅ Seeded default CompensationRules for active PlanVersion.');
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    console.log('🔒 Production environment detected: Skipping development sample fixtures (demo posts, sample services, and project templates).');
  } else {
    console.log('🧪 Development/Test environment detected: Seeding sample fixtures...');

    // Seed Initial Community Announcement
    const existingPost = await prisma.communityPost.findFirst({
      where: { authorId: adminUser.id, postType: 'ANNOUNCEMENT' },
    });

    if (!existingPost) {
      await prisma.communityPost.create({
        data: {
          authorId: adminUser.id,
          content: 'Welcome to the new Executive Community & Leadership Engagement Platform! Connect with your team, track your leadership training, and execute with clarity.',
          postType: 'ANNOUNCEMENT',
          visibility: 'PUBLIC_COMMUNITY',
          isPinned: true,
        },
      });
      console.log('✅ Seeded initial Community Announcement post.');
    }

    // Seed Default Digital Services Catalog
    const defaultServices = [
      { code: 'GOHIGHLEVEL_SETUP', name: 'GoHighLevel Setup & CRM Architecture', category: 'AUTOMATION', defaultDurationDays: 14, description: 'Complete GHL account setup, pipelines, workflows, triggers, and calendar integration.' },
      { code: 'WEBSITE', name: 'Custom Website & Portal Development', category: 'DIGITAL_MARKETING', defaultDurationDays: 30, description: 'Responsive web application or marketing website development.' },
      { code: 'FUNNEL', name: 'High-Converting Sales Funnel Development', category: 'DIGITAL_MARKETING', defaultDurationDays: 14, description: 'Sales funnel design, copywriting, page optimization, and payment integration.' },
      { code: 'N8N_AUTOMATION', name: 'n8n Workflow Automation Architecture', category: 'AUTOMATION', defaultDurationDays: 10, description: 'Custom n8n self-hosted workflow automation, API webhooks, and data synchronization.' },
      { code: 'AI_AGENT', name: 'Custom AI Agent & Conversational AI Integration', category: 'AUTOMATION', defaultDurationDays: 21, description: 'LLM agent implementation, custom knowledge base, and automated customer response workflows.' },
      { code: 'EMAIL_MARKETING', name: 'Email Marketing & Campaign Architecture', category: 'DIGITAL_MARKETING', defaultDurationDays: 7, description: 'Email sequence setup, domain deliverability setup, and newsletter template creation.' },
      { code: 'COPYWRITING', name: 'Direct-Response Copywriting & Messaging', category: 'CONSULTING', defaultDurationDays: 7, description: 'Persuasive sales copy for landing pages, ads, and email sequences.' },
      { code: 'CRM_IMPLEMENTATION', name: 'Custom CRM & Pipeline Setup', category: 'AUTOMATION', defaultDurationDays: 14, description: 'Pipeline stage configuration, lead routing rules, and sales team setup.' },
      { code: 'CONSULTING', name: 'Digital Marketing & Growth Consulting', category: 'CONSULTING', defaultDurationDays: 30, description: 'Strategic digital growth advisory, campaign audit, and operational strategy.' },
    ];

    for (const service of defaultServices) {
      await prisma.digitalService.upsert({
        where: { code: service.code },
        update: { name: service.name, category: service.category, defaultDurationDays: service.defaultDurationDays, description: service.description },
        create: service,
      });
    }
    console.log('✅ Seeded default DigitalServices catalog.');

    // Seed Sample Project Template
    const ghlService = await prisma.digitalService.findUnique({ where: { code: 'GOHIGHLEVEL_SETUP' } });
    if (ghlService) {
      const template = await prisma.projectTemplate.upsert({
        where: { code: 'TPL_GHL_SETUP' },
        update: { name: 'Standard GoHighLevel Setup Template', estimatedDurationDays: 14 },
        create: {
          code: 'TPL_GHL_SETUP',
          name: 'Standard GoHighLevel Setup Template',
          description: 'Standard 14-day GoHighLevel onboarding and technical configuration template.',
          serviceId: ghlService.id,
          estimatedDurationDays: 14,
        },
      });

      const milestoneData = [
        { name: 'Discovery & Account Provisioning', sequence: 1, dayOffset: 3, description: 'Initial onboarding questionnaire, DNS setup, and user account provisioning.' },
        { name: 'Pipeline & Calendar Configuration', sequence: 2, dayOffset: 7, description: 'Custom pipelines, stages, tags, custom fields, and booking calendars.' },
        { name: 'Workflow & Trigger Automation', sequence: 3, dayOffset: 11, description: 'Automated SMS/Email follow-up sequences and lead distribution triggers.' },
        { name: 'Testing & Client Handover', sequence: 4, dayOffset: 14, description: 'End-to-end workflow testing, video documentation, and final review.' },
      ];

      for (const m of milestoneData) {
        const existingM = await prisma.projectTemplateMilestone.findFirst({
          where: { templateId: template.id, sequence: m.sequence },
        });
        if (!existingM) {
          await prisma.projectTemplateMilestone.create({
            data: {
              templateId: template.id,
              name: m.name,
              sequence: m.sequence,
              dayOffset: m.dayOffset,
              description: m.description,
            },
          });
        }
      }
      console.log('✅ Seeded sample GoHighLevel ProjectTemplate & milestones.');
    }
  }

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
