import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { Mail } from 'lucide-react';

export default function MessagesPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Direct Messaging & Team Conversations"
      category="COMMUNITY & ENGAGEMENT"
      description="Private direct messaging, group chat threads, read receipt tracking, and document sharing."
      icon={<Mail className="w-8 h-8 text-amber-400" />}
      stage="Phase 5 Reserve"
    />
  );
}
