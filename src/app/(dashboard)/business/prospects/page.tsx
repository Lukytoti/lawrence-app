import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { UserPlus } from 'lucide-react';

export default function ProspectsPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Prospect CRM & Pipeline"
      category="BUSINESS DEVELOPMENT"
      description="Prospect lead tracking, stage pipelines, automated follow-up reminders, and conversion history."
      icon={<UserPlus className="w-8 h-8 text-blue-400" />}
      stage="Phase 6 Reserve"
    />
  );
}
