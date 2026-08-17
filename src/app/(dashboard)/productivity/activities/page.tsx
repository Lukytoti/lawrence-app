import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { Activity } from 'lucide-react';

export default function ActivitiesPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Daily Activity Engine"
      category="PRODUCTIVITY"
      description="Daily/weekly activity logging, screenshot/evidence attachment uploads, and Leader verification queues."
      icon={<Activity className="w-8 h-8 text-amber-400" />}
      stage="Phase 4 Reserve"
    />
  );
}
