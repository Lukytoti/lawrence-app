import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { CreditCard } from 'lucide-react';

export default function FinancialRequestsPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Financial Request & Approval Engine"
      category="FINANCIAL MANAGEMENT"
      description="Payout requests, expense submissions, Admin approval/rejection/dispute workflows, and supporting evidence attachments."
      icon={<CreditCard className="w-8 h-8 text-amber-400" />}
      stage="Phase 7 Reserve"
    />
  );
}
