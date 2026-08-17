'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { triggerAiInsightsAction } from '../actions';

interface Props {
  initialData: {
    summary: any;
    recentConversations: any[];
    insights: any[];
  };
  userId: string;
}

export function AiDashboardClient({ initialData, userId }: Props) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const handleTriggerInsights = async () => {
    setLoading(true);
    try {
      const newInsights = await triggerAiInsightsAction(userId);
      setData((prev) => ({
        ...prev,
        insights: newInsights,
        summary: {
          ...prev.summary,
          newInsightsCount: newInsights.length,
        },
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const { summary } = data;

  return (
    <div style={{ padding: '24px', background: '#09090B', minHeight: '100vh', color: '#F4F4F5' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#FFFFFF' }}>
            AI Executive Leadership Co-Pilot
          </h1>
          <p style={{ color: '#A1A1AA', fontSize: '14px', margin: '4px 0 0 0' }}>
            Natural Language Intelligence & Automated Cross-Domain Insights Engine
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleTriggerInsights}
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
            {loading ? 'Analyzing System...' : '⚡ Generate Strategic Insights'}
          </button>
          <Link
            href="/ai/chat"
            style={{
              background: '#18181B',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '10px 18px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            💬 Open Co-Pilot Chat
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#18181B', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: '#A1A1AA', fontSize: '13px' }}>Prompts Used Today</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#991B1B', marginTop: '4px' }}>
            {summary.promptsUsedToday} / {summary.dailyQuotaLimit}
          </div>
        </div>

        <div style={{ background: '#18181B', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: '#A1A1AA', fontSize: '13px' }}>Active Strategic Insights</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3B82F6', marginTop: '4px' }}>
            {summary.newInsightsCount}
          </div>
        </div>

        <div style={{ background: '#18181B', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: '#A1A1AA', fontSize: '13px' }}>Critical Action Warnings</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: summary.criticalInsightsCount > 0 ? '#EF4444' : '#10B981', marginTop: '4px' }}>
            {summary.criticalInsightsCount}
          </div>
        </div>

        <div style={{ background: '#18181B', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: '#A1A1AA', fontSize: '13px' }}>Tokens Consumed</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F59E0B', marginTop: '4px' }}>
            {summary.tokensConsumedThisMonth.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Strategic Insights Grid */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
            Recent Strategic Insights
          </h2>
          <Link href="/ai/insights" style={{ color: '#991B1B', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
            View All Insights &rarr;
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {data.insights.slice(0, 3).map((insight) => (
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
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#A1A1AA' }}>{insight.domain}</span>
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
                  {insight.severity}
                </span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px 0', color: '#FFFFFF' }}>{insight.title}</h3>
              <p style={{ color: '#D4D4D8', fontSize: '14px', margin: '0 0 12px 0', lineHeight: '1.4' }}>{insight.summary}</p>
              <div style={{ background: '#09090B', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#A1A1AA' }}>
                <strong>Recommendation:</strong> {insight.actionableRecommendation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
