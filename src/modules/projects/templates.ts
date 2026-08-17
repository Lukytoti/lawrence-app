import { db } from '@/lib/db';

export async function getProjectTemplates(onlyActive = true) {
  return db.projectTemplate.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    include: { service: true, milestones: { orderBy: { sequence: 'asc' } } },
    orderBy: { name: 'asc' },
  });
}

export async function getProjectTemplateById(templateId: string) {
  return db.projectTemplate.findUnique({
    where: { id: templateId },
    include: { service: true, milestones: { orderBy: { sequence: 'asc' } } },
  });
}

export async function createProjectTemplate(data: {
  code: string;
  name: string;
  description?: string;
  serviceId?: string;
  estimatedDurationDays?: number;
  milestones?: Array<{ name: string; sequence: number; dayOffset: number; description?: string }>;
}) {
  return db.projectTemplate.create({
    data: {
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description,
      serviceId: data.serviceId,
      estimatedDurationDays: data.estimatedDurationDays || 30,
      milestones: data.milestones
        ? {
            create: data.milestones.map((m) => ({
              name: m.name,
              sequence: m.sequence,
              dayOffset: m.dayOffset,
              description: m.description,
            })),
          }
        : undefined,
    },
    include: { milestones: true },
  });
}

export async function applyTemplateToProject(projectId: string, templateId: string) {
  const template = await getProjectTemplateById(templateId);
  if (!template) throw new Error(`Project template ${templateId} not found.`);

  const now = new Date();
  const createdMilestones = [];

  for (const tm of template.milestones) {
    const dueDate = new Date(now.getTime() + tm.dayOffset * 24 * 60 * 60 * 1000);
    const m = await db.digitalMilestone.create({
      data: {
        projectId,
        name: tm.name,
        description: tm.description,
        sequence: tm.sequence,
        status: 'PENDING',
        dueDate,
      },
    });
    createdMilestones.push(m);
  }

  return createdMilestones;
}
