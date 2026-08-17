import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserConversations, getConversationMessages } from '@/modules/community/messaging';
import { MessagingCockpitClient } from '@/modules/community/components/MessagingCockpitClient';

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return <div className="p-6 text-white text-xs">Please log in to access private messages.</div>;
  }

  const conversations = await getUserConversations(userId);
  const defaultConvId = conversations[0]?.conversationId;
  const initialMessages = defaultConvId ? await getConversationMessages(defaultConvId, userId) : [];

  return (
    <MessagingCockpitClient
      initialConversations={conversations}
      currentUserId={userId}
      activeConversationId={defaultConvId}
      initialMessages={initialMessages}
    />
  );
}
