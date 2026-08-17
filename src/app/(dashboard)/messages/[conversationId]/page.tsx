import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserConversations, getConversationMessages } from '@/modules/community/messaging';
import { MessagingCockpitClient } from '@/modules/community/components/MessagingCockpitClient';

export default async function ConversationThreadPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const { conversationId } = await params;

  if (!userId) {
    return <div className="p-6 text-white text-xs">Please log in to access private messaging.</div>;
  }

  const conversations = await getUserConversations(userId);
  let messages: any[] = [];
  try {
    messages = await getConversationMessages(conversationId, userId);
  } catch (e) {
    // If not authorized to view conversation
    messages = [];
  }

  return (
    <MessagingCockpitClient
      initialConversations={conversations}
      currentUserId={userId}
      activeConversationId={conversationId}
      initialMessages={messages}
    />
  );
}
