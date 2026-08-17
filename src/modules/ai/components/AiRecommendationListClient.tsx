'use client';

import React from 'react';

export function AiRecommendationListClient() {
  const recommendations = [
    {
      id: 'REC-01',
      targetEntityType: 'CLIENT',
      title: 'Proactive Renewal Offer for Enterprise Digital Client',
      recommendationText:
        'Client health score is 92%. Recommend offering a 12-month contract renewal with 5% expansion incentive.',
      confidenceScore: 0.96,
      status: 'PENDING',
    },
    {
      id: 'REC-02',
      targetEntityType: 'MEMBER',
      title: 'Director Rank Promotion Focus for Line Leader',
      recommendationText:
        'Downline member is 450 PPV away from Director qualification. Recommend 1-on-1 coaching call on sales volume.',
      confidenceScore: 0.94,
      status: 'PENDING',
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#09090B', minHeight: '100vh', color: '#F4F4F5' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#FFFFFF' }}>
          Smart System Recommendations Engine
        </h1>
        <p style={{ color: '#A1A1AA', fontSize: '14px', margin: '4px 0 0 0' }}>
          Automated Decision Support for Retention, Recruiting & Organizational Growth
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            style={{
              background: '#18181B',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#991B1B' }}>
                TARGET: {rec.targetEntityType} | CONFIDENCE: {(rec.confidenceScore * 100).toFixed(0)}%
              </span>
              <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 600 }}>{rec.status}</span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 8px 0' }}>{rec.title}</h3>
            <p style={{ color: '#D4D4D8', fontSize: '14px', margin: 0 }}>{rec.recommendationText}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
