'use client';

import React, { useState } from 'react';
import { triggerAiInsightsAction } from '../actions';

interface Props {
  initialInsights: any[];
  userId: string;
}

export function AiInsightListClient({ initialInsights, userId }: Props) {
  const [insights, setInsights] = useState(initialInsights);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const updated = await triggerAiInsightsAction(userId);
      setInsights(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#09090B', minHeight: '100vh', color: '#F4F4F5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#FFFFFF' }}>
            Automated Strategic AI Insights Workspace
          </h1>
          <p style={{ color: '#A1A1AA', fontSize: '14px', margin: '4px 0 0 0' }}>
            Continuous Cross-Domain Monitoring & Actionable Executive Recommendations
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            background: '#7F1D1D',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 18px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {loading ? 'Re-scanning System...' : '🔄 Run Strategic System Scan'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {insights.map((insight) => (
          <div
            key={insight.id}
            style={{
              background: '#18181B',
              borderRadius: '8px',
              padding: '20px',
              borderLeft: `4px solid ${
                insight.severity === 'CRITICAL' || insight.severity === 'HIGH' ? '#EF4444' : '#3B82F6'
              }`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#A1A1AA' }}>
                DOMAIN: {insight.domain} | CODE: {insight.insightCode}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: insight.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: insight.severity === 'CRITICAL' ? '#EF4444' : '#60A5FA',
                  fontWeight: 600,
                }}
              >
                {insight.severity} SEVERITY
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px 0', color: '#FFFFFF' }}>{insight.title}</h2>
            <p style={{ color: '#D4D4D8', fontSize: '14px', margin: '0 0 16px 0', lineHeight: '1.5' }}>{insight.summary}</p>
            <div style={{ background: '#09090B', padding: '14px', borderRadius: '6px', fontSize: '13px', color: '#F4F4F5' }}>
              <strong style={{ color: '#991B1B' }}>Executive Recommendation:</strong> {insight.actionableRecommendation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
