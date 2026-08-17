import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { UserCheck } from 'lucide-react';

export default function OneOnOnesPage() {
  return (
    <ModulePlaceholderPage
      moduleName="1-on-1 Leadership Sessions"
      category="LEADERSHIP OPERATING SYSTEM"
      description="Scheduled 1-on-1 agenda templates, action item tracking, meeting notes, and follow-up commitments."
      icon={<UserCheck className="w-8 h-8 text-blue-400" />}
      stage="Phase 8 Reserve"
    />
  );
}
