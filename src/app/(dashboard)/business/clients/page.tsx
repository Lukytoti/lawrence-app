import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { Briefcase } from 'lucide-react';

export default function ClientsPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Digital Marketing Client Portal"
      category="BUSINESS DEVELOPMENT"
      description="Client profiles, retainer agreements, project briefs, billing history, and client communication records."
      icon={<Briefcase className="w-8 h-8 text-amber-400" />}
      stage="Phase 6 Reserve"
    />
  );
}
