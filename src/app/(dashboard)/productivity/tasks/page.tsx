import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { CheckSquare } from 'lucide-react';

export default function TasksPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Task Assignment & Execution Engine"
      category="PRODUCTIVITY"
      description="Task creation, priority assignment, status workflows, due date reminders, and member task boards."
      icon={<CheckSquare className="w-8 h-8 text-blue-400" />}
      stage="Phase 4 Reserve"
    />
  );
}
