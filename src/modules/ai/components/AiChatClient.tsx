'use client';

import React, { useState } from 'react';
import { submitAiPromptAction } from '../actions';
import { AiContextDomain } from '../types';

interface Props {
  userId: string;
  initialConversation?: any;
}

export function AiChatClient({ userId, initialConversation }: Props) {
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversation?.id
  );
  const [messages, setMessages] = useState<any[]>(
    initialConversation?.messages || [
      {
        id: 'welcome',
        role: 'ASSISTANT',
        content:
          'Hello Oluwatobi! I am your AI Executive Leadership Co-Pilot. Ask me anything regarding downline productivity, client retention health, financial ledger postings, or workflow automations.',
        citations: [],
      },
    ]
  );
  const [prompt, setPrompt] = useState('');
  const [contextDomain, setContextDomain] = useState<AiContextDomain>('GENERAL');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userText = prompt.trim();
    setPrompt('');
    setLoading(true);

    // Append user message to state UI immediately
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'USER',
      content: userText,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await submitAiPromptAction(userId, {
        conversationId,
        prompt: userText,
        contextDomain,
      });

      setConversationId(res.conversationId);

      const assistantMsg = {
        id: res.messageId,
        role: 'ASSISTANT',
        content: res.response,
        citations: res.citations,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'ASSISTANT',
          content: `⚠️ Error: ${err.message || 'Failed to process AI prompt'}`,
          citations: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#09090B', color: '#F4F4F5', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#FFFFFF' }}>
            Interactive AI Executive Co-Pilot Workspace
          </h1>
          <p style={{ color: '#A1A1AA', fontSize: '13px', margin: '4px 0 0 0' }}>
            Context-Aware RAG Engine connected across all 14 completed business modules
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', color: '#A1A1AA' }}>Domain Focus:</label>
          <select
            value={contextDomain}
            onChange={(e) => setContextDomain(e.target.value as AiContextDomain)}
            style={{
              background: '#18181B',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '13px',
            }}
          >
            <option value="GENERAL">ALL DOMAINS (General)</option>
            <option value="ORGANIZATION">ORGANIZATION & PPV</option>
            <option value="RETENTION">RETENTION & HEALTH</option>
            <option value="FINANCIAL">FINANCIAL LEDGER</option>
            <option value="CRM">CRM & PROSPECTS</option>
            <option value="PROJECTS">PROJECT DELIVERY</option>
            <option value="PRODUCTIVITY">PRODUCTIVITY SCORES</option>
          </select>
        </div>
      </div>

      {/* Messages Stream */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignSelf: msg.role === 'USER' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              background: msg.role === 'USER' ? '#7F1D1D' : '#18181B',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#A1A1AA', marginBottom: '6px' }}>
              {msg.role === 'USER' ? 'Oluwatobi (Super Admin)' : 'AI Executive Co-Pilot'}
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.content}</div>

            {msg.citations && msg.citations.length > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, marginBottom: '4px' }}>
                  CONCURRENT DOMAIN CITATIONS:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {msg.citations.map((c: any, i: number) => (
                    <a
                      key={i}
                      href={c.url}
                      style={{
                        background: '#09090B',
                        color: '#60A5FA',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        textDecoration: 'none',
                      }}
                    >
                      🔗 {c.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask AI Co-Pilot about downline performance, overdue invoices, client retention..."
          style={{
            flex: 1,
            background: '#18181B',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '12px 16px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          style={{
            background: '#7F1D1D',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '12px 24px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {loading ? 'Thinking...' : 'Send Prompt'}
        </button>
      </form>
    </div>
  );
}
