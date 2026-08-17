import React from 'react';
import ComplianceDashboardClient from '@/modules/governance/components/ComplianceDashboardClient';
import { getComplianceOverview } from '@/modules/governance/service';

export const metadata = {
  title: 'Compliance Dashboard | Lawrence Operating System',
  description: 'SOC2, ISO27001, GDPR & Internal control registry.',
};

export default async function ComplianceDashboardPage() {
  const data = await getComplianceOverview();
  return <ComplianceDashboardClient data={data} />;
}
