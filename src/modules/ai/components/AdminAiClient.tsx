'use client';

import React from 'react';

export function AdminAiClient() {
  return (
    <div style={{ padding: '24px', background: '#09090B', minHeight: '100vh', color: '#F4F4F5' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#FFFFFF' }}>
          AI Engine System Administration
        </h1>
        <p style={{ color: '#A1A1AA', fontSize: '14px', margin: '4px 0 0 0' }}>
          LLM Model Parameters, Usage Quotas & Audit Cost Analysis
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: '#18181B', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 12px 0' }}>Default Model Configuration</h3>
          <div style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: '1.6' }}>
            <div><strong>Active Model:</strong> gemini-2.5-flash</div>
            <div><strong>Fallback Model:</strong> gemini-1.5-pro</div>
            <div><strong>Max Output Tokens:</strong> 2,048</div>
            <div><strong>Temperature:</strong> 0.2</div>
          </div>
        </div>

        <div style={{ background: '#18181B', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 12px 0' }}>User Usage Quota Policies</h3>
          <div style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: '1.6' }}>
            <div><strong>Super Admin Quota:</strong> 1,000 prompts / day</div>
            <div><strong>Standard Member Quota:</strong> 100 prompts / day</div>
            <div><strong>Auto Reset Window:</strong> Midnight UTC</div>
          </div>
        </div>
      </div>
    </div>
  );
}
