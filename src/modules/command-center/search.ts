import { db } from '@/lib/db';
import { SearchDomain, SearchQueryInput, SearchQueryOutput, SearchResultItem } from './types';
import { hasPermission } from '@/lib/rbac';
import { isSuperAdminUser } from './permissions';

export async function canAccessSearchResult(
  userId: string,
  domain: SearchDomain,
  entityId: string
): Promise<boolean> {
  const isSuper = await isSuperAdminUser(userId);
  if (isSuper) return true;

  switch (domain) {
    case 'MEMBERS':
    case 'ORGANIZATIONS':
      return hasPermission(userId, 'users:read');
    case 'CRM_LEADS':
    case 'CRM_OPPORTUNITIES':
      return (
        (await hasPermission(userId, 'crm:read_all')) ||
        (await hasPermission(userId, 'crm:read_team')) ||
        (await hasPermission(userId, 'crm:read_own'))
      );
    case 'CLIENTS':
    case 'PROJECTS':
      return (
        (await hasPermission(userId, 'projects:read_all')) ||
        (await hasPermission(userId, 'projects:read_own'))
      );
    case 'INVOICES':
    case 'CONTRACTS':
    case 'PAYMENTS':
      return (
        (await hasPermission(userId, 'billing:read_all')) ||
        (await hasPermission(userId, 'billing:read_own'))
      );
    case 'RETENTION_CASES':
    case 'RENEWALS':
      return (
        (await hasPermission(userId, 'retention:read_all')) ||
        (await hasPermission(userId, 'retention:read_own'))
      );
    case 'TASKS':
      return hasPermission(userId, 'tasks:read');
    case 'WORKFLOWS':
    case 'EXECUTIONS':
      return (
        (await hasPermission(userId, 'automation:read_all')) ||
        (await hasPermission(userId, 'automation:read_own'))
      );
    case 'NOTIFICATIONS':
      return (
        (await hasPermission(userId, 'notifications:read_all')) ||
        (await hasPermission(userId, 'notifications:read_own'))
      );
    default:
      return true;
  }
}

export async function searchAll(
  input: SearchQueryInput,
  actorUserId: string
): Promise<SearchQueryOutput> {
  const query = (input.query || '').trim();
  const limit = Math.min(input.limit || 20, 50);
  const offset = input.offset || 0;

  if (!query) {
    return { results: [], totalCount: 0, query: '', limit, offset };
  }

  const results: SearchResultItem[] = [];

  // Parallel cross-domain searching
  const searchTasks: Promise<SearchResultItem[]>[] = [];

  // 1. Members Search
  if (!input.domain || input.domain === 'MEMBERS') {
    searchTasks.push(
      canAccessSearchResult(actorUserId, 'MEMBERS', '').then(async (allowed) => {
        if (!allowed) return [];
        const members = await db.user.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
          include: { networkMember: true, profile: true },
        });
        return members.map((m) => ({
          id: m.id,
          entityType: 'User',
          title: m.profile?.displayName || m.name || m.email,
          subtitle: `Member Code: ${m.networkMember?.memberCode || 'N/A'} • ${m.email}`,
          status: m.status,
          relevance: 100,
          domain: 'MEMBERS' as SearchDomain,
          route: `/network/members/${m.id}`,
          permittedActions: ['VIEW_MEMBER', 'SEND_MESSAGE'],
        }));
      })
    );
  }

  // 2. CRM Leads Search
  if (!input.domain || input.domain === 'CRM_LEADS') {
    searchTasks.push(
      canAccessSearchResult(actorUserId, 'CRM_LEADS', '').then(async (allowed) => {
        if (!allowed) return [];
        const leads = await db.crmLead.findMany({
          where: {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { companyName: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
        });
        return leads.map((l) => ({
          id: l.id,
          entityType: 'CrmLead',
          title: `${l.firstName} ${l.lastName}`,
          subtitle: `Lead Code: ${l.leadCode} • ${l.companyName || l.email || 'Prospect'}`,
          status: l.status,
          relevance: 90,
          domain: 'CRM_LEADS' as SearchDomain,
          route: `/crm/leads/${l.id}`,
          permittedActions: ['VIEW_LEAD', 'UPDATE_STAGE', 'CONVERT_LEAD'],
        }));
      })
    );
  }

  // 3. Digital Clients Search
  if (!input.domain || input.domain === 'CLIENTS') {
    searchTasks.push(
      canAccessSearchResult(actorUserId, 'CLIENTS', '').then(async (allowed) => {
        if (!allowed) return [];
        const clients = await db.digitalClient.findMany({
          where: {
            OR: [
              { companyName: { contains: query, mode: 'insensitive' } },
              { contactName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { clientCode: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
        });
        return clients.map((c) => ({
          id: c.id,
          entityType: 'DigitalClient',
          title: c.companyName || c.contactName,
          subtitle: `Client Code: ${c.clientCode} • ${c.email || c.status}`,
          status: c.status,
          relevance: 95,
          domain: 'CLIENTS' as SearchDomain,
          route: `/retention/clients/${c.id}`,
          permittedActions: ['VIEW_CLIENT', 'VIEW_COCKPIT', 'CREATE_CASE'],
        }));
      })
    );
  }

  // 4. Digital Projects Search
  if (!input.domain || input.domain === 'PROJECTS') {
    searchTasks.push(
      canAccessSearchResult(actorUserId, 'PROJECTS', '').then(async (allowed) => {
        if (!allowed) return [];
        const projects = await db.digitalProject.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { projectCode: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
        });
        return projects.map((p) => ({
          id: p.id,
          entityType: 'DigitalProject',
          title: p.title,
          subtitle: `Project Code: ${p.projectCode} • Value: ₦${Number(p.contractValue).toLocaleString()}`,
          status: p.status,
          relevance: 85,
          domain: 'PROJECTS' as SearchDomain,
          route: `/projects/${p.id}`,
          permittedActions: ['VIEW_PROJECT', 'UPDATE_STATUS'],
        }));
      })
    );
  }

  // 5. Invoices Search
  if (!input.domain || input.domain === 'INVOICES') {
    searchTasks.push(
      canAccessSearchResult(actorUserId, 'INVOICES', '').then(async (allowed) => {
        if (!allowed) return [];
        const invoices = await db.invoice.findMany({
          where: {
            OR: [{ invoiceNumber: { contains: query, mode: 'insensitive' } }],
          },
          take: limit,
        });
        return invoices.map((inv) => ({
          id: inv.id,
          entityType: 'Invoice',
          title: `Invoice #${inv.invoiceNumber}`,
          subtitle: `Amount: ₦${Number(inv.totalAmount).toLocaleString()} • Due: ${inv.dueDate.toISOString().split('T')[0]}`,
          status: inv.status,
          relevance: 80,
          domain: 'INVOICES' as SearchDomain,
          route: `/billing/invoices/${inv.id}`,
          permittedActions: ['VIEW_INVOICE', 'RECORD_PAYMENT'],
        }));
      })
    );
  }

  // 6. Tasks Search
  if (!input.domain || input.domain === 'TASKS') {
    searchTasks.push(
      canAccessSearchResult(actorUserId, 'TASKS', '').then(async (allowed) => {
        if (!allowed) return [];
        const tasks = await db.task.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
        });
        return tasks.map((t) => ({
          id: t.id,
          entityType: 'Task',
          title: t.title,
          subtitle: `Priority: ${t.priority} • Status: ${t.status}`,
          status: t.status,
          relevance: 75,
          domain: 'TASKS' as SearchDomain,
          route: `/productivity/tasks`,
          permittedActions: ['VIEW_TASK', 'COMPLETE_TASK'],
        }));
      })
    );
  }

  const taskResults = await Promise.all(searchTasks);
  const flatResults = taskResults.flat();

  // Paginate and sort by relevance
  const paginatedResults = flatResults
    .sort((a, b) => b.relevance - a.relevance)
    .slice(offset, offset + limit);

  return {
    results: paginatedResults,
    totalCount: flatResults.length,
    query,
    domain: input.domain,
    limit,
    offset,
  };
}

export async function searchDomain(
  domain: SearchDomain,
  query: string,
  actorUserId: string,
  limit: number = 20
): Promise<SearchResultItem[]> {
  const res = await searchAll({ query, domain, limit }, actorUserId);
  return res.results;
}

export async function getSearchResult(
  domain: SearchDomain,
  entityId: string,
  actorUserId: string
): Promise<SearchResultItem | null> {
  const allowed = await canAccessSearchResult(actorUserId, domain, entityId);
  if (!allowed) return null;

  const res = await searchAll({ query: entityId, domain, limit: 1 }, actorUserId);
  return res.results[0] || null;
}
