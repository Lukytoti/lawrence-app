import React from 'react';
import { ModulePlaceholderPage } from '@/components/ui/ModulePlaceholderPage';
import { MessageSquare } from 'lucide-react';

export default function CommunityFeedPage() {
  return (
    <ModulePlaceholderPage
      moduleName="Community Feed & Discussion Board"
      category="COMMUNITY & ENGAGEMENT"
      description="Organization discussion feed, team posts, comments, likes, recognition shoutouts, and media attachments."
      icon={<MessageSquare className="w-8 h-8 text-blue-400" />}
      stage="Phase 5 Reserve"
    />
  );
}
