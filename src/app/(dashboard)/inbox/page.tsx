import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { Inbox } from 'lucide-react';

export default function InboxPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Unified Executive Inbox"
      category="COMMAND CENTER"
      description="Centralized inbox aggregating urgent notifications, task approvals, financial requests, direct messages, and system alerts."
      icon={<Inbox className="w-8 h-8 text-blue-400" />}
      stage="Phase 4 Reserve"
    />
  );
}
