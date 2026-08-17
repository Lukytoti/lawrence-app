import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { FileText } from 'lucide-react';

export default function ReportsPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Activity & Team Reports Engine"
      category="PRODUCTIVITY"
      description="Mandatory activity report submissions, leader review workflows, missing report flags, and compliance auditing."
      icon={<FileText className="w-8 h-8 text-blue-400" />}
      stage="Phase 4 Reserve"
    />
  );
}
