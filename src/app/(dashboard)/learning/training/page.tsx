import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { GraduationCap } from 'lucide-react';

export default function TrainingPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Training Modules & Curriculums"
      category="LEARNING & GROWTH"
      description="Video/document training modules, onboarding curriculums, assessment quizzes, and completion certificates."
      icon={<GraduationCap className="w-8 h-8 text-amber-400" />}
      stage="Phase 5 Reserve"
    />
  );
}
