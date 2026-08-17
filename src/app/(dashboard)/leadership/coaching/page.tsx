import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { Compass } from 'lucide-react';

export default function CoachingPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Leadership Coaching & Mentorship"
      category="LEADERSHIP OPERATING SYSTEM"
      description="Leader coaching assignments, goal alignment sessions, feedback logs, and leadership development pipelines."
      icon={<Compass className="w-8 h-8 text-emerald-400" />}
      stage="Phase 8 Reserve"
    />
  );
}
