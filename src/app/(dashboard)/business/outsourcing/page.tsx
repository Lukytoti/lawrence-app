import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { Share2 } from 'lucide-react';

export default function OutsourcingPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Task Outsourcing & Sub-Contracting"
      category="BUSINESS DEVELOPMENT"
      description="Outsourcing client deliverables to team members, task assignment, payout calculations, and quality reviews."
      icon={<Share2 className="w-8 h-8 text-wine-text" />}
      stage="Phase 6 Reserve"
    />
  );
}
