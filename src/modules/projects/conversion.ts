import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { applyTemplateToProject } from './templates';

export async function convertWonOpportunityToProject(
  crmOpportunityId: string,
  actorUserId: string,
  options?: {
    serviceId?: string;
    templateId?: string;
    projectManagerId?: string;
  }
) {
  return db.$transaction(async (tx) => {
    // 1. Lock CrmOpportunity row FOR UPDATE to prevent race conditions
    await tx.$queryRaw`SELECT id FROM "CrmOpportunity" WHERE id = ${crmOpportunityId} FOR UPDATE;`;

    // 2. Check if project already converted (Idempotency Check)
    const existingProject = await tx.digitalProject.findFirst({
      where: { crmOpportunityId },
      include: { client: true, service: true, milestones: true },
    });

    if (existingProject) {
      return { project: existingProject, newlyCreated: false };
    }

    // 2. Fetch Opportunity with Lead
    const opportunity = await tx.crmOpportunity.findUnique({
      where: { id: crmOpportunityId },
      include: { lead: { include: { convertedClient: true } } },
    });

    if (!opportunity) {
      throw new Error(`CRM Opportunity ${crmOpportunityId} not found.`);
    }

    if (opportunity.status !== 'WON') {
      throw new Error(`Cannot convert opportunity ${crmOpportunityId}. Status must be WON.`);
    }

    const domainUpper = opportunity.businessDomain.toUpperCase();
    if (domainUpper !== 'DIGITAL_MARKETING' && domainUpper !== 'OUTSOURCING') {
      throw new Error(
        `Cannot convert opportunity ${crmOpportunityId}. Domain must be DIGITAL_MARKETING or OUTSOURCING.`
      );
    }

    // 3. Resolve or Create DigitalClient
    let clientId: string;
    if (opportunity.lead.convertedClient) {
      clientId = opportunity.lead.convertedClient.id;
    } else {
      const clientCount = await tx.digitalClient.count();
      const timestamp = Date.now().toString().slice(-4);
      const clientCode = `CLT-${10001 + clientCount}-${timestamp}`;
      const leadContactName =
        `${opportunity.lead.firstName || ''} ${opportunity.lead.lastName || ''}`.trim() || 'Valued Client';

      const newClient = await tx.digitalClient.create({
        data: {
          clientCode,
          leadId: opportunity.leadId,
          companyName: opportunity.lead.companyName || leadContactName,
          contactName: leadContactName,
          email: opportunity.lead.email,
          phone: opportunity.lead.phone,
          status: 'ACTIVE',
        },
      });
      clientId = newClient.id;
    }

    // 4. Generate Unique Project Code
    const projectCount = await tx.digitalProject.count();
    const projTs = Date.now().toString().slice(-4);
    const projectCode = `PRJ-${10001 + projectCount}-${projTs}`;

    // 5. Create DigitalProject
    const project = await tx.digitalProject.create({
      data: {
        projectCode,
        clientId,
        crmOpportunityId: opportunity.id,
        serviceId: options?.serviceId,
        ownerId: opportunity.ownerId,
        projectManagerId: options?.projectManagerId || opportunity.ownerId,
        title: `Project: ${opportunity.title}`,
        description: `Project auto-converted from Won Opportunity: ${opportunity.title}`,
        status: 'PLANNED',
        priority: 'MEDIUM',
        startDate: new Date(),
        targetEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        currency: opportunity.currency || 'NGN',
        contractValue: opportunity.value || 0,
      },
      include: { client: true, service: true },
    });

    // 6. Instantiate Template Milestones if template provided
    if (options?.templateId) {
      await applyTemplateToProject(project.id, options.templateId);
    }

    // 7. Record Project Activity
    await tx.projectActivity.create({
      data: {
        projectId: project.id,
        actorId: actorUserId,
        activityType: 'PROJECT_CREATED',
        visibility: 'INTERNAL',
        description: `Project converted from Won Opportunity ${opportunity.title}`,
        metadataJson: JSON.stringify({ crmOpportunityId, contractValue: Number(opportunity.value) }),
      },
    });

    // 8. Log Audit Event
    await logAuditEvent({
      actorId: actorUserId,
      action: 'PROJECT_CREATED',
      entityType: 'DigitalProject',
      entityId: project.id,
      metadata: { crmOpportunityId, projectCode: project.projectCode },
    });

    return { project, newlyCreated: true };
  });
}
