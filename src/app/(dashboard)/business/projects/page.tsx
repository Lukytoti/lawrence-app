import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { FolderKanban } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Digital Marketing Projects Engine"
      category="BUSINESS DEVELOPMENT"
      description="Kanban project boards, deliverable milestones, asset file attachments, and completion tracking."
      icon={<FolderKanban className="w-8 h-8 text-emerald-400" />}
      stage="Phase 6 Reserve"
    />
  );
}
