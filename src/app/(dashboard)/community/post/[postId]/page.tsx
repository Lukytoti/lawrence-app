import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVisibleCommunityFeed } from '@/modules/community/posts';
import { CommunityFeedClient } from '@/modules/community/components/CommunityFeedClient';

export default async function CommunityPostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const { postId } = await params;

  if (!userId) {
    return <div className="p-6 text-white text-xs">Please log in to view community post details.</div>;
  }

  const posts = await getVisibleCommunityFeed(userId, 30);
  const singlePost = posts.filter((p) => p.id === postId);

  return <CommunityFeedClient initialPosts={singlePost.length > 0 ? singlePost : posts} currentUserId={userId} />;
}
