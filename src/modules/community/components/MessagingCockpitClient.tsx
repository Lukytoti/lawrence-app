'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCheck,
  Check,
  User,
  Shield,
  Search,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { sendMessageAction, markReadAction } from '../actions';

interface MessagingCockpitClientProps {
  initialConversations: any[];
  currentUserId: string;
  activeConversationId?: string;
  initialMessages?: any[];
}

export function MessagingCockpitClient({
  initialConversations,
  currentUserId,
  activeConversationId,
  initialMessages = [],
}: MessagingCockpitClientProps) {
  const [conversations, setConversations] = useState<any[]>(initialConversations);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    activeConversationId || (conversations[0]?.conversationId ?? null)
  );
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const selectedConv = conversations.find((c) => c.conversationId === selectedConvId);
  const otherParticipant = selectedConv?.participants?.find((p: any) => p.userId !== currentUserId)?.user;
  const recipientName = otherParticipant?.profile?.displayName || otherParticipant?.name || 'Leadership Contact';

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !inputMessage.trim()) return;

    setIsSending(true);
    try {
      const res = await sendMessageAction(selectedConvId, inputMessage);
      if (res.success && res.message) {
        setMessages([...messages, res.message]);
        setInputMessage('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (selectedConvId) {
      markReadAction(selectedConvId).catch(() => {});
    }
  }, [selectedConvId]);

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col md:flex-row gap-4 overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
      {/* Left Column: Conversation List */}
      <div className="w-full md:w-80 border-r border-white/10 flex flex-col bg-slate-950/40">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-rose-500" />
            Messages
          </h2>
          <p className="text-xs text-slate-400 mt-1">Live-updating direct & group chats</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No active conversations yet.</div>
          ) : (
            conversations.map((conv) => {
              const other = conv.participants?.find((p: any) => p.userId !== currentUserId)?.user;
              const name = other?.profile?.displayName || other?.name || 'Contact';
              const isSelected = conv.conversationId === selectedConvId;

              return (
                <button
                  key={conv.conversationId}
                  onClick={() => setSelectedConvId(conv.conversationId)}
                  className={`w-full p-4 text-left flex items-center gap-3 transition-colors ${
                    isSelected ? 'bg-rose-950/40 border-l-4 border-rose-600' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-sm text-rose-300">
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate">{name}</span>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-slate-500">
                          {new Date(conv.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {conv.isUnread && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Conversation Stream */}
      <div className="flex-1 flex flex-col bg-slate-900/80">
        {selectedConvId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-950 to-slate-800 border border-rose-700/40 flex items-center justify-center text-rose-200 font-bold text-xs">
                  {recipientName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{recipientName}</h3>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" /> Server-Secured Private Channel
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  This is the beginning of your private message history with {recipientName}.
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === currentUserId;
                  const isRead = msg.readReceipts?.some((r: any) => r.readerId !== currentUserId);

                  return (
                    <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-md p-3 rounded-xl text-xs space-y-1 ${
                          isOwn
                            ? 'bg-gradient-to-r from-red-950 to-wine-900 text-white rounded-br-none border border-rose-800/40 shadow-md'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-white/10'
                        }`}
                      >
                        <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                        <div className={`flex items-center gap-1 text-[10px] ${isOwn ? 'text-rose-300 justify-end' : 'text-slate-400'}`}>
                          <span>
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwn && (
                            isRead ? <CheckCheck className="w-3 h-3 text-cyan-400" /> : <Check className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center gap-3">
              <input
                type="text"
                placeholder={`Message ${recipientName}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-700"
              />
              <button
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-red-900 to-wine-800 hover:from-red-800 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Select a conversation to open messaging.
          </div>
        )}
      </div>
    </div>
  );
}
