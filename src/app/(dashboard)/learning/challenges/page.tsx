import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { Zap } from 'lucide-react';

export default function ChallengesPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Team Challenges & Achievements"
      category="LEARNING & GROWTH"
      description="Time-bound team productivity challenges, performance leaderboards, and achievement badges."
      icon={<Zap className="w-8 h-8 text-wine-text" />}
      stage="Phase 5 Reserve"
    />
  );
}
