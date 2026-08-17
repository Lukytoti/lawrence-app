import { NextResponse } from 'next/server';
import { getProductionReadinessReport } from '@/modules/command-center/readiness';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const report = await getProductionReadinessReport();
    const httpStatus = report.overallStatus === 'FAILED' ? 503 : 200;

    return NextResponse.json(report, { status: httpStatus });
  } catch (error: any) {
    return NextResponse.json(
      {
        overallStatus: 'FAILED',
        error: error.message || 'Production readiness probe failed',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
