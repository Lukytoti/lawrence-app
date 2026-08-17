import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { Star } from 'lucide-react';

export default function RecognitionPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Member Recognition & Honor Roll"
      category="LEADERSHIP OPERATING SYSTEM"
      description="Public recognition callouts, top producer awards, activity streak honors, and rank promotion celebrations."
      icon={<Star className="w-8 h-8 text-amber-400" />}
      stage="Phase 8 Reserve"
    />
  );
}
