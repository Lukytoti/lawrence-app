import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { Target } from 'lucide-react';

export default function GoalsPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Goal Setting & Progression Engine"
      category="PRODUCTIVITY"
      description="Quarterly/monthly goal targets, milestone tracking, individual goal setting, and organization goal dashboards."
      icon={<Target className="w-8 h-8 text-wine-text" />}
      stage="Phase 4 Reserve"
    />
  );
}
