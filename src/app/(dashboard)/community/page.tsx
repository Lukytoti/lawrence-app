import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVisibleCommunityFeed } from '@/modules/community/posts';
import { CommunityFeedClient } from '@/modules/community/components/CommunityFeedClient';

export default async function CommunityPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return <div className="p-6 text-white text-xs">Please log in to view the community feed.</div>;
  }

  const posts = await getVisibleCommunityFeed(userId, 30);

  return <CommunityFeedClient initialPosts={posts} currentUserId={userId} />;
}
