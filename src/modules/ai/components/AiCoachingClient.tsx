'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  initialPrompts: any[];
  userId: string;
}

export function AiCoachingClient({ initialPrompts }: Props) {
  const router = useRouter();
  const [prompts] = useState(initialPrompts);

  const handleLaunchCoaching = (promptTemplate: string) => {
    router.push(`/ai/chat?prompt=${encodeURIComponent(promptTemplate)}`);
  };

  return (
    <div style={{ padding: '24px', background: '#09090B', minHeight: '100vh', color: '#F4F4F5' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#FFFFFF' }}>
          1-on-1 AI Leadership Coaching Assistant
        </h1>
        <p style={{ color: '#A1A1AA', fontSize: '14px', margin: '4px 0 0 0' }}>
          Tailored Guidance & Strategic Scripts for Network Marketing Leaders & Executive Administrators
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {prompts.map((item) => (
          <div
            key={item.id}
            style={{
              background: '#18181B',
              borderRadius: '8px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#991B1B', marginBottom: '6px' }}>
                {item.category}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 12px 0' }}>
                {item.title}
              </h3>
              <p style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                {item.promptTemplate}
              </p>
            </div>
            <button
              onClick={() => handleLaunchCoaching(item.promptTemplate)}
              style={{
                background: '#7F1D1D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 16px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              🚀 Launch Coaching Session
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
