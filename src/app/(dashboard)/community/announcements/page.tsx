import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { Megaphone } from 'lucide-react';

export default function AnnouncementsPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Executive Announcements & Broadcasts"
      category="COMMUNITY & ENGAGEMENT"
      description="System-wide official broadcasts from Super Admin, targeted team notifications, and priority pinned alerts."
      icon={<Megaphone className="w-8 h-8 text-wine-text" />}
      stage="Phase 5 Reserve"
    />
  );
}
