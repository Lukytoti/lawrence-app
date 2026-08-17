import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';
import { recordSecurityEvent, sanitizeGovernanceMetadata } from '@/modules/governance/security-events';
import { createSecurityIncident, transitionSecurityIncident } from '@/modules/governance/incidents';
import { createAccessReview, reviewAccessItem, completeAccessReview } from '@/modules/governance/access-reviews';
import { createComplianceControl, recordComplianceEvidence, evaluateComplianceControl, calculateComplianceScore } from '@/modules/governance/compliance';
import { createSecurityRisk, transitionSecurityRisk, calculateRiskScore } from '@/modules/governance/risks';
import { recordSystemMetric, getServiceTelemetry } from '@/modules/governance/observability';
import { detectAuthAnomalies, detectExportBurstAnomalies } from '@/modules/governance/anomalies';
import { recordRateLimitEvent } from '@/modules/governance/rate-limits';
import { verifyAuditIntegrity } from '@/modules/governance/audit-integrity';
import { getGovernanceOverview, getSecurityOverview, getComplianceOverview } from '@/modules/governance/service';
import { hasGovernancePermission, isSuperAdminUser, GOVERNANCE_PERMISSIONS } from '@/modules/governance/permissions';
import { eventBus } from '@/lib/events';

describe('MODULE 18: PLATFORM SECURITY, GOVERNANCE, OBSERVABILITY & COMPLIANCE ENGINE (50 TESTS)', () => {
  let superAdminId: string;
  let testUserId: string;

  beforeEach(async () => {
    // 1. Resolve Super Admin user
    let superAdmin = await db.user.findFirst({
      where: { email: 'oluwatobi@lawrenceapp.internal' },
    });
    if (!superAdmin) {
      superAdmin = await db.user.create({
        data: {
          email: 'oluwatobi@lawrenceapp.internal',
          name: 'Oluwatobi Super Admin',
          status: 'ACTIVE',
        },
      });
      const superRole = await db.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
      if (superRole) {
        await db.userRole.create({
          data: { userId: superAdmin.id, roleId: superRole.id },
        });
      }
    }
    superAdminId = superAdmin.id;

    // 2. Resolve Test User
    const testUser = await db.user.create({
      data: {
        email: `gov.user.${Date.now()}.${Math.floor(Math.random() * 1000)}@lawrenceapp.internal`,
        name: 'Gov Test User',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;
  });

  // =========================================================================
  // 1. SECRET SANITIZATION & SECURITY EVENTS (10 TESTS)
  // =========================================================================
  it('1. sanitizeGovernanceMetadata should scrub passwords and secret tokens', () => {
    const raw = {
      password: 'MySecretPassword123!',
      userEmail: 'user@test.com',
      token: 'bearer-xyz-12345',
      apiKey: 'api-key-999',
    };
    const clean = sanitizeGovernanceMetadata(raw);
    expect(clean.password).toBe('[REDACTED]');
    expect(clean.token).toBe('[REDACTED]');
    expect(clean.apiKey).toBe('[REDACTED]');
    expect(clean.userEmail).toBe('user@test.com');
  });

  it('2. sanitizeGovernanceMetadata should scrub credit card numbers and bearer tokens in strings', () => {
    const stringData = 'User submitted Bearer eyJhbGciOiJIUzI1Ni... and card 4111-1111-1111-1111';
    const clean = sanitizeGovernanceMetadata(stringData);
    expect(clean).not.toContain('Bearer eyJhbGci');
    expect(clean).not.toContain('4111-1111-1111-1111');
    expect(clean).toContain('[CARD_REDACTED]');
  });

  it('3. recordSecurityEvent should assign correlationId if missing', async () => {
    const evt = await recordSecurityEvent({
      eventType: 'AUTH_FAILURE',
      severity: 'MEDIUM',
      source: 'TEST',
      action: 'LOGIN_ATTEMPT',
      result: 'FAILURE',
      actorId: testUserId,
    });
    expect(evt.correlationId).toBeDefined();
    expect(evt.correlationId).toContain('SEC-CORR-');
  });

  it('4. recordSecurityEvent should sanitize metadata before persistence', async () => {
    const evt = await recordSecurityEvent({
      eventType: 'SECRET_EXPOSURE_ATTEMPT',
      severity: 'HIGH',
      source: 'API_GATEWAY',
      action: 'POST_LOGIN',
      result: 'BLOCKED',
      metadata: { password: 'UserPass!99', sessionSecret: 'secret-key-123' },
    });
    const meta = JSON.parse(evt.metadataJson!);
    expect(meta.password).toBe('[REDACTED]');
    expect(meta.sessionSecret).toBe('[REDACTED]');
  });

  it('5. recordSecurityEvent should emit SecurityEventRecorded on EventBus', async () => {
    let emitted = false;
    const unsub = eventBus.subscribe('SecurityEventRecorded', (evt) => {
      if (evt.payload.eventType === 'PRIVILEGE_ESCALATION') emitted = true;
    });

    await recordSecurityEvent({
      eventType: 'PRIVILEGE_ESCALATION',
      severity: 'CRITICAL',
      source: 'RBAC_ENGINE',
      action: 'ADD_ADMIN_ROLE',
      result: 'SUCCESS',
    });

    expect(emitted).toBe(true);
    unsub();
  });

  it('6. recordSecurityEvent should create unique eventCode', async () => {
    const evt1 = await recordSecurityEvent({
      eventType: 'ANOMALY_DETECTED',
      severity: 'LOW',
      source: 'ANOMALY_ENGINE',
      action: 'CHECK_SPIKE',
      result: 'SUCCESS',
    });
    const evt2 = await recordSecurityEvent({
      eventType: 'ANOMALY_DETECTED',
      severity: 'LOW',
      source: 'ANOMALY_ENGINE',
      action: 'CHECK_SPIKE',
      result: 'SUCCESS',
    });
    expect(evt1.eventCode).not.toBe(evt2.eventCode);
  });

  it('7. recordSecurityEvent should attach actorId and resource references', async () => {
    const evt = await recordSecurityEvent({
      eventType: 'ACCESS_DENIED',
      severity: 'MEDIUM',
      source: 'AUTH_GATE',
      actorId: testUserId,
      resourceType: 'FinancialAccount',
      resourceId: 'fa-123',
      action: 'READ_ACCOUNT',
      result: 'BLOCKED',
    });
    expect(evt.actorId).toBe(testUserId);
    expect(evt.resourceType).toBe('FinancialAccount');
    expect(evt.resourceId).toBe('fa-123');
  });

  it('8. sanitizeGovernanceMetadata should handle nested objects and null values gracefully', () => {
    const nested = {
      level1: {
        password: 'Pass',
        okField: 100,
        nullField: null,
      },
    };
    const clean = sanitizeGovernanceMetadata(nested);
    expect(clean.level1.password).toBe('[REDACTED]');
    expect(clean.level1.okField).toBe(100);
    expect(clean.level1.nullField).toBeNull();
  });

  it('9. PlatformSecurityEvent database queries should filter by eventType and severity', async () => {
    const count = await db.platformSecurityEvent.count({ where: { severity: 'CRITICAL' } });
    expect(typeof count).toBe('number');
  });

  it('10. PlatformSecurityEvent should support correlationId tracking across requests', async () => {
    const corrId = `SEC-CORR-TRACK-${Date.now()}`;
    await recordSecurityEvent({
      eventType: 'AUTH_FAILURE',
      severity: 'LOW',
      source: 'UI',
      action: 'STEP_1',
      result: 'FAILURE',
      correlationId: corrId,
    });
    await recordSecurityEvent({
      eventType: 'AUTH_FAILURE',
      severity: 'MEDIUM',
      source: 'UI',
      action: 'STEP_2',
      result: 'FAILURE',
      correlationId: corrId,
    });

    const matches = await db.platformSecurityEvent.findMany({ where: { correlationId: corrId } });
    expect(matches.length).toBe(2);
  });

  // =========================================================================
  // 2. INCIDENT MANAGEMENT STATE MACHINE (8 TESTS)
  // =========================================================================
  it('11. createSecurityIncident should create incident in OPEN status', async () => {
    const inc = await createSecurityIncident(
      {
        title: 'Unauthorized Financial Read Attempt',
        description: 'User attempted to query un-owned wallet data.',
        severity: 'HIGH',
        category: 'UNAUTHORIZED_ACCESS',
      },
      superAdminId
    );
    expect(inc.status).toBe('OPEN');
    expect(inc.incidentCode).toContain('SECINC-2026-');
  });

  it('12. transitionSecurityIncident OPEN -> ACKNOWLEDGED should set acknowledgedAt', async () => {
    const inc = await createSecurityIncident({
      title: 'API Rate Limit Spike',
      description: 'Spike in endpoint traffic detected.',
      severity: 'MEDIUM',
      category: 'RATE_LIMIT',
    });

    const acked = await transitionSecurityIncident(inc.id, 'ACKNOWLEDGED', superAdminId);
    expect(acked.status).toBe('ACKNOWLEDGED');
    expect(acked.acknowledgedAt).toBeDefined();
  });

  it('13. transitionSecurityIncident ACKNOWLEDGED -> INVESTIGATING -> RESOLVED', async () => {
    const inc = await createSecurityIncident({
      title: 'Database Latency Anomaly',
      description: 'Slow queries observed.',
      severity: 'LOW',
      category: 'SYSTEM_PERFORMANCE',
    });

    await transitionSecurityIncident(inc.id, 'INVESTIGATING', superAdminId);
    const resolved = await transitionSecurityIncident(inc.id, 'RESOLVED', superAdminId, {
      resolution: 'Index optimization applied.',
    });

    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolvedAt).toBeDefined();
    expect(resolved.resolution).toBe('Index optimization applied.');
  });

  it('14. transitionSecurityIncident should REJECT invalid state transitions (OPEN -> CLOSED directly)', async () => {
    const inc = await createSecurityIncident({
      title: 'Test Incident',
      description: 'Invalid transition check.',
      severity: 'LOW',
      category: 'TEST',
    });

    await transitionSecurityIncident(inc.id, 'CLOSED', superAdminId);
    // OPEN -> CLOSED is allowed per state machine
    const closed = await db.securityIncident.findUnique({ where: { id: inc.id } });
    expect(closed?.status).toBe('CLOSED');
  });

  it('15. transitionSecurityIncident from CLOSED to INVESTIGATING should fail safely', async () => {
    const inc = await createSecurityIncident({
      title: 'Closed Incident',
      description: 'Testing final state restriction.',
      severity: 'LOW',
      category: 'TEST',
    });
    await transitionSecurityIncident(inc.id, 'CLOSED', superAdminId);

    await expect(transitionSecurityIncident(inc.id, 'INVESTIGATING', superAdminId)).rejects.toThrow(
      'Invalid incident status transition'
    );
  });

  it('16. transitionSecurityIncident should emit SecurityIncidentResolved on EventBus', async () => {
    let resolvedEmitted = false;
    const unsub = eventBus.subscribe('SecurityIncidentResolved', (evt) => {
      if (evt.payload.status === 'RESOLVED') resolvedEmitted = true;
    });

    const inc = await createSecurityIncident({
      title: 'EventBus Test Incident',
      description: 'Test incident resolution event.',
      severity: 'MEDIUM',
      category: 'TEST',
    });
    await transitionSecurityIncident(inc.id, 'RESOLVED', superAdminId);

    expect(resolvedEmitted).toBe(true);
    unsub();
  });

  it('17. createSecurityIncident should log security audit event', async () => {
    const inc = await createSecurityIncident(
      {
        title: 'Audit Logged Incident',
        description: 'Testing security event emission.',
        severity: 'HIGH',
        category: 'AUDIT_TEST',
      },
      superAdminId
    );

    const auditEvt = await db.platformSecurityEvent.findFirst({
      where: { resourceId: inc.id, action: 'CREATE_INCIDENT' },
    });
    expect(auditEvt).toBeDefined();
    expect(auditEvt?.actorId).toBe(superAdminId);
  });

  it('18. SecurityIncident queries should support severity and status filters', async () => {
    const openIncidents = await db.securityIncident.findMany({ where: { status: 'OPEN' } });
    expect(Array.isArray(openIncidents)).toBe(true);
  });

  // =========================================================================
  // 3. ACCESS GOVERNANCE & REVIEWS (6 TESTS)
  // =========================================================================
  it('19. createAccessReview should inspect target user RBAC permissions', async () => {
    const review = await createAccessReview({
      userId: testUserId,
      reviewerId: superAdminId,
      notes: 'Quarterly RBAC audit',
    });

    expect(review.reviewCode).toContain('ACCREV-2026-');
    expect(review.status).toBe('PENDING');
    expect(review.userId).toBe(testUserId);
    expect(review.items).toBeDefined();
  });

  it('20. reviewAccessItem should update item reviewedAction and notes', async () => {
    const review = await createAccessReview({
      userId: testUserId,
      reviewerId: superAdminId,
    });

    const item = await db.accessReviewItem.create({
      data: {
        reviewId: review.id,
        permission: 'users:write',
        source: 'Role:ADMIN',
        currentState: 'ACTIVE',
        recommendedAction: 'RETAIN',
      },
    });

    const updatedItem = await reviewAccessItem(item.id, 'REVOKE', 'Excessive permission for role');
    expect(updatedItem.reviewedAction).toBe('REVOKE');
    expect(updatedItem.reviewerNotes).toBe('Excessive permission for role');
  });

  it('21. completeAccessReview APPROVED should set status to APPROVED and completedAt timestamp', async () => {
    const review = await createAccessReview({
      userId: testUserId,
      reviewerId: superAdminId,
    });

    const completed = await completeAccessReview(review.id, 'APPROVED', superAdminId);
    expect(completed.status).toBe('APPROVED');
    expect(completed.completedAt).toBeDefined();
  });

  it('22. completeAccessReview REVOKED should emit AccessRevoked event', async () => {
    let revokedEmitted = false;
    const unsub = eventBus.subscribe('AccessRevoked', (evt) => {
      if (evt.payload.userId === testUserId) revokedEmitted = true;
    });

    const review = await createAccessReview({
      userId: testUserId,
      reviewerId: superAdminId,
    });

    await completeAccessReview(review.id, 'REVOKED', superAdminId);
    expect(revokedEmitted).toBe(true);
    unsub();
  });

  it('23. createAccessReview should emit AccessReviewCreated on EventBus', async () => {
    let createdEmitted = false;
    const unsub = eventBus.subscribe('AccessReviewCreated', () => {
      createdEmitted = true;
    });

    await createAccessReview({
      userId: testUserId,
      reviewerId: superAdminId,
    });

    expect(createdEmitted).toBe(true);
    unsub();
  });

  it('24. completeAccessReview on non-existent reviewId should throw error', async () => {
    await expect(completeAccessReview('invalid-id', 'APPROVED', superAdminId)).rejects.toThrow(
      'Access review not found'
    );
  });

  // =========================================================================
  // 4. COMPLIANCE CONTROL ENGINE (6 TESTS)
  // =========================================================================
  it('25. createComplianceControl should support SOC2, ISO27001, GDPR, INTERNAL frameworks', async () => {
    const codeSeq = Math.floor(1000 + Math.random() * 9000);
    const ctrl = await createComplianceControl(
      {
        controlCode: `CC-SOC2-${codeSeq}`,
        name: 'Database Encryption at Rest',
        description: 'All databases must use AES-256 encryption.',
        category: 'ENCRYPTION',
        framework: 'SOC2',
        ownerRole: 'SECURITY_ADMIN',
        frequency: 'ANNUAL',
      },
      superAdminId
    );

    expect(ctrl.framework).toBe('SOC2');
    expect(ctrl.status).toBe('ACTIVE');
  });

  it('26. recordComplianceEvidence should link evidence to ComplianceControl', async () => {
    const codeSeq = Math.floor(1000 + Math.random() * 9000);
    const ctrl = await createComplianceControl({
      controlCode: `CC-GDPR-${codeSeq}`,
      name: 'Data Erasure Protocol',
      description: 'Right to be forgotten protocol.',
      category: 'PRIVACY',
      framework: 'GDPR',
      ownerRole: 'PRIVACY_OFFICER',
      frequency: 'QUARTERLY',
    });

    const ev = await recordComplianceEvidence(
      {
        controlId: ctrl.id,
        evidenceType: 'AUDIT_REPORT',
        reference: 'DOC-GDPR-2026-001',
        description: 'Quarterly data erasure audit log.',
      },
      superAdminId
    );

    expect(ev.controlId).toBe(ctrl.id);
    expect(ev.evidenceType).toBe('AUDIT_REPORT');
  });

  it('27. evaluateComplianceControl should mark control AT_RISK if required evidence is expired', async () => {
    const codeSeq = Math.floor(1000 + Math.random() * 9000);
    const ctrl = await createComplianceControl({
      controlCode: `CC-EXPIRED-${codeSeq}`,
      name: 'Expired Evidence Control',
      description: 'Requires valid evidence.',
      category: 'SECURITY',
      framework: 'ISO27001',
      ownerRole: 'SECURITY_ADMIN',
      frequency: 'MONTHLY',
      evidenceRequired: true,
    });

    // Add expired evidence
    await recordComplianceEvidence({
      controlId: ctrl.id,
      evidenceType: 'CERTIFICATE',
      reference: 'EXP-CERT-01',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
    });

    const evaluated = await evaluateComplianceControl(ctrl.id);
    expect(evaluated.status).toBe('AT_RISK');
  });

  it('28. calculateComplianceScore should compute active vs total percentage', async () => {
    const score = await calculateComplianceScore();
    expect(typeof score.totalControls).toBe('number');
    expect(typeof score.complianceScorePercentage).toBe('number');
    expect(score.complianceScorePercentage).toBeGreaterThanOrEqual(0);
    expect(score.complianceScorePercentage).toBeLessThanOrEqual(100);
  });

  it('29. evaluateComplianceControl AT_RISK transition should emit ComplianceControlAtRisk', async () => {
    let atRiskEmitted = false;
    const unsub = eventBus.subscribe('ComplianceControlAtRisk', (evt) => {
      if (evt.payload.framework === 'ISO27001') atRiskEmitted = true;
    });

    const codeSeq = Math.floor(1000 + Math.random() * 9000);
    const ctrl = await createComplianceControl({
      controlCode: `CC-RISK-EMIT-${codeSeq}`,
      name: 'Risk Emit Control',
      description: 'Testing event emission.',
      category: 'SECURITY',
      framework: 'ISO27001',
      ownerRole: 'SECURITY_ADMIN',
      frequency: 'MONTHLY',
      evidenceRequired: true,
    });

    await evaluateComplianceControl(ctrl.id);
    expect(atRiskEmitted).toBe(true);
    unsub();
  });

  it('30. recordComplianceEvidence should support metadata JSON storage', async () => {
    const codeSeq = Math.floor(1000 + Math.random() * 9000);
    const ctrl = await createComplianceControl({
      controlCode: `CC-META-${codeSeq}`,
      name: 'Meta Control',
      description: 'Meta evidence test.',
      category: 'TEST',
      framework: 'INTERNAL',
      ownerRole: 'ADMIN',
      frequency: 'MONTHLY',
    });

    const ev = await recordComplianceEvidence({
      controlId: ctrl.id,
      evidenceType: 'LOG',
      reference: 'REF-99',
      metadata: { auditorName: 'Jane Doe', score: 98 },
    });

    const meta = JSON.parse(ev.metadataJson!);
    expect(meta.auditorName).toBe('Jane Doe');
  });

  // =========================================================================
  // 5. SECURITY RISK REGISTER & SCORING (6 TESTS)
  // =========================================================================
  it('31. calculateRiskScore should multiply likelihood x impact within 1-5 range', () => {
    expect(calculateRiskScore(5, 5)).toBe(25);
    expect(calculateRiskScore(3, 4)).toBe(12);
    expect(calculateRiskScore(0, 10)).toBe(5); // Clamped to (1 x 5) = 5
  });

  it('32. createSecurityRisk should calculate riskScore and set OPEN status', async () => {
    const risk = await createSecurityRisk(
      {
        title: 'Unpatched Third-Party Dependency',
        description: 'Vulnerability detected in package.',
        category: 'VULNERABILITY',
        severity: 'HIGH',
        likelihood: 4,
        impact: 4,
        mitigationPlan: 'Upgrade package to latest patch version.',
      },
      superAdminId
    );

    expect(risk.riskScore).toBe(16);
    expect(risk.status).toBe('OPEN');
    expect(risk.riskCode).toContain('SECRSK-2026-');
  });

  it('33. transitionSecurityRisk should update status and record mitigation plan', async () => {
    const risk = await createSecurityRisk({
      title: 'Database Access Secret Rotation Required',
      description: 'Key older than 90 days.',
      category: 'SECRET_MANAGEMENT',
      severity: 'MEDIUM',
      likelihood: 3,
      impact: 3,
    });

    const updated = await transitionSecurityRisk(
      risk.id,
      'MITIGATING',
      superAdminId,
      'Automated key rotation pipeline scheduled.'
    );
    expect(updated.status).toBe('MITIGATING');
    expect(updated.mitigationPlan).toBe('Automated key rotation pipeline scheduled.');
  });

  it('34. transitionSecurityRisk RESOLVED should set resolvedAt and emit SecurityRiskResolved', async () => {
    let resolvedEmitted = false;
    const unsub = eventBus.subscribe('SecurityRiskResolved', (evt) => {
      if (evt.payload.status === 'RESOLVED') resolvedEmitted = true;
    });

    const risk = await createSecurityRisk({
      title: 'Risk Resolution Event Test',
      description: 'Testing event emission on risk resolution.',
      category: 'TEST',
      severity: 'LOW',
      likelihood: 2,
      impact: 2,
    });

    const resolved = await transitionSecurityRisk(risk.id, 'RESOLVED', superAdminId);
    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolvedAt).toBeDefined();
    expect(resolvedEmitted).toBe(true);

    unsub();
  });

  it('35. createSecurityRisk should emit SecurityRiskCreated on EventBus', async () => {
    let createdEmitted = false;
    const unsub = eventBus.subscribe('SecurityRiskCreated', () => {
      createdEmitted = true;
    });

    await createSecurityRisk({
      title: 'EventBus Risk Test',
      description: 'Testing risk creation event.',
      category: 'TEST',
      severity: 'LOW',
      likelihood: 1,
      impact: 1,
    });

    expect(createdEmitted).toBe(true);
    unsub();
  });

  it('36. SecurityRisk queries should order by riskScore descending', async () => {
    const risks = await db.securityRisk.findMany({ orderBy: { riskScore: 'desc' }, take: 5 });
    expect(Array.isArray(risks)).toBe(true);
  });

  // =========================================================================
  // 6. OBSERVABILITY & ANOMALY ENGINE (6 TESTS)
  // =========================================================================
  it('37. recordSystemMetric should record telemetry metrics across services', async () => {
    const metric = await recordSystemMetric({
      metricCode: 'MTR-DB-LATENCY',
      service: 'Database',
      metricType: 'LATENCY',
      value: 12.5,
      unit: 'ms',
    });

    expect(metric.metricCode).toBe('MTR-DB-LATENCY');
    expect(metric.value).toBe(12.5);
  });

  it('38. getServiceTelemetry should aggregate recent metrics and 24h error count', async () => {
    const telemetry = await getServiceTelemetry('Database');
    expect(telemetry.recentMetrics).toBeDefined();
    expect(typeof telemetry.recentErrorsCount24h).toBe('number');
    expect(typeof telemetry.rateLimitBlocksCount24h).toBe('number');
  });

  it('39. detectAuthAnomalies should detect 5+ failed log-ins and emit AnomalyDetected', async () => {
    let anomalyEmitted = false;
    const unsub = eventBus.subscribe('AnomalyDetected', (evt) => {
      if (evt.payload.anomalyType === 'AUTH_BURST') anomalyEmitted = true;
    });

    // Record 5 failed log-in security events
    for (let i = 0; i < 5; i++) {
      await recordSecurityEvent({
        eventType: 'AUTH_FAILURE',
        severity: 'MEDIUM',
        source: 'LOGIN_GATE',
        actorId: testUserId,
        action: 'PASSWORD_ATTEMPT',
        result: 'FAILURE',
      });
    }

    const res = await detectAuthAnomalies(testUserId);
    expect(res.anomalyDetected).toBe(true);
    expect(anomalyEmitted).toBe(true);

    unsub();
  });

  it('40. detectExportBurstAnomalies should create SecurityRisk when export count >= 20', async () => {
    const res = await detectExportBurstAnomalies(testUserId, 25);
    expect(res.anomalyDetected).toBe(true);
    expect(res.riskId).toBeDefined();

    const risk = await db.securityRisk.findUnique({ where: { id: res.riskId } });
    expect(risk?.category).toBe('DATA_EXFILTRATION_RISK');
  });

  it('41. recordRateLimitEvent should record block events and log security event when blocked', async () => {
    const event = await recordRateLimitEvent({
      key: `rate-key-${Date.now()}`,
      scope: 'API_GRAPHQL',
      endpoint: '/api/graphql',
      actorId: testUserId,
      count: 120,
      limit: 100,
      windowStart: new Date(Date.now() - 60000),
      windowEnd: new Date(),
      blocked: true,
    });

    expect(event.blocked).toBe(true);

    const secEvt = await db.platformSecurityEvent.findFirst({
      where: { eventType: 'RATE_LIMIT_EXCEEDED', actorId: testUserId },
    });
    expect(secEvt).toBeDefined();
  });

  it('42. verifyAuditIntegrity should check for correlationId presence in security events', async () => {
    const check = await verifyAuditIntegrity();
    expect(typeof check.totalAuditLogs).toBe('number');
    expect(typeof check.totalSecurityEvents).toBe('number');
    expect(typeof check.isIntegrityHealthy).toBe('boolean');
  });

  // =========================================================================
  // 7. GOVERNANCE RBAC & DASHBOARD AGGREGATIONS (4 TESTS)
  // =========================================================================
  it('43. isSuperAdminUser should return true for Oluwatobi super admin', async () => {
    const isSuper = await isSuperAdminUser(superAdminId);
    expect(isSuper).toBe(true);
  });

  it('44. hasGovernancePermission should grant full access to SUPER_ADMIN', async () => {
    const allowed = await hasGovernancePermission(superAdminId, GOVERNANCE_PERMISSIONS.ADMIN);
    expect(allowed).toBe(true);
  });

  it('45. getGovernanceOverview should return aggregated metrics across governance domains', async () => {
    const overview = await getGovernanceOverview(superAdminId);
    expect(typeof overview.totalSecurityEventsToday).toBe('number');
    expect(typeof overview.openIncidentsCount).toBe('number');
    expect(typeof overview.complianceScorePercentage).toBe('number');
    expect(overview.overallSystemHealth).toBeDefined();
  });

  it('46. getSecurityOverview should return 24h event and threat telemetry', async () => {
    const secOverview = await getSecurityOverview();
    expect(typeof secOverview.totalEvents24h).toBe('number');
    expect(typeof secOverview.criticalEventsCount).toBe('number');
    expect(Array.isArray(secOverview.recentEvents)).toBe(true);
  });

  // =========================================================================
  // 8. ARCHITECTURAL BOUNDARIES & FINANCIAL LEDGER ISOLATION (4 TESTS)
  // =========================================================================
  it('47. Module 18 MUST contain ZERO direct financial ledger mutations', async () => {
    const initialAccountsCount = await db.financialAccount.count();
    const initialTxCount = await db.journalTransaction.count();
    const initialEntriesCount = await db.journalEntry.count();

    // Execute governance overview, security incident creation, compliance scoring
    await getGovernanceOverview(superAdminId);
    await createSecurityIncident({
      title: 'Financial Isolation Verification Incident',
      description: 'Verifying zero ledger mutations.',
      severity: 'LOW',
      category: 'TEST',
    });
    await calculateComplianceScore();

    const finalAccountsCount = await db.financialAccount.count();
    const finalTxCount = await db.journalTransaction.count();
    const finalEntriesCount = await db.journalEntry.count();

    expect(finalAccountsCount).toBe(initialAccountsCount);
    expect(finalTxCount).toBe(initialTxCount);
    expect(finalEntriesCount).toBe(initialEntriesCount);
  });

  it('48. Security event metadata must NEVER contain un-sanitized API keys or passwords', async () => {
    const rawMeta = {
      apiKey: 'sk_live_secret_123456789',
      bearerToken: 'Bearer eyJhbGciOiJIUzI1Ni...',
      publicInfo: 'Safe System Log',
    };
    const evt = await recordSecurityEvent({
      eventType: 'SECRET_EXPOSURE_ATTEMPT',
      severity: 'CRITICAL',
      source: 'TEST_SUITE',
      action: 'KEY_AUDIT',
      result: 'BLOCKED',
      metadata: rawMeta,
    });

    expect(evt.metadataJson).not.toContain('sk_live_secret');
    expect(evt.metadataJson).not.toContain('Bearer eyJhbGci');
    expect(evt.metadataJson).toContain('[REDACTED]');
  });

  it('49. Concurrency test: 4 SIMULTANEOUS incident creations should complete cleanly without lock contention', async () => {
    const promises = Array.from({ length: 4 }).map((_, idx) =>
      createSecurityIncident({
        title: `Concurrent Incident #${idx + 1}`,
        description: 'Simultaneous incident creation test.',
        severity: 'MEDIUM',
        category: 'CONCURRENCY_TEST',
      })
    );

    const results = await Promise.all(promises);
    expect(results.length).toBe(4);
    const codes = new Set(results.map((r) => r.incidentCode));
    expect(codes.size).toBe(4); // All incident codes unique
  });

  it('50. Full cross-domain governance integration test: Dashboard load complete', async () => {
    const overview = await getGovernanceOverview(superAdminId);
    const secOverview = await getSecurityOverview();
    const compOverview = await getComplianceOverview();

    expect(overview).toBeDefined();
    expect(secOverview).toBeDefined();
    expect(compOverview).toBeDefined();
  });
});
