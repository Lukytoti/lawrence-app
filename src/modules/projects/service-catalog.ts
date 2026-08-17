import { db } from '@/lib/db';
import { DuplicateServiceCodeError } from './errors';
export async function getDigitalServices(onlyActive = true) {
  return db.digitalService.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: { name: 'asc' },
  });
}

export async function getDigitalServiceByCode(code: string) {
  return db.digitalService.findUnique({
    where: { code },
  });
}

export async function createDigitalService(data: {
  code: string;
  name: string;
  description?: string;
  category?: string;
  defaultDurationDays?: number;
}) {
  try {
    return await db.digitalService.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        category: data.category || 'DIGITAL_MARKETING',
        defaultDurationDays: data.defaultDurationDays || 14,
        isActive: true,
      },
    });
  } catch (err: any) {
    if (err.code === 'P2002' && err.meta?.target?.includes('code')) {
      throw new DuplicateServiceCodeError(data.code);
    }
    throw err;
  }
}

export async function setDigitalServiceStatus(id: string, isActive: boolean) {
  return db.digitalService.update({
    where: { id },
    data: { isActive },
  });
}
