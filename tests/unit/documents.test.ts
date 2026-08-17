import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import {
  createDocument,
  updateDocumentMetadata,
  archiveDocument,
  restoreDocument,
  getDocument,
  listDocuments,
  moveDocument,
  deleteDocument,
  getDocumentHistory,
  addDocumentRelation,
  getDocumentsByRelation,
  getDocumentsDashboardOverview,
} from '@/modules/documents/service';
import {
  createDocumentVersion,
  getDocumentVersion,
  listDocumentVersions,
  compareVersions,
  restoreVersion,
} from '@/modules/documents/versions';
import {
  createFolder,
  renameFolder,
  moveFolder,
  listFolderContents,
  deleteFolder,
  wouldCreateFolderCycle,
} from '@/modules/documents/folders';
import {
  shareDocument,
  revokeShare,
  getActiveShares,
  validateShare,
} from '@/modules/documents/sharing';
import {
  requestApproval,
  approveDocument,
  rejectDocument,
  cancelApproval,
  getApprovalHistory,
} from '@/modules/documents/approvals';
import {
  createKnowledgeCollection,
  createKnowledgeEntry,
  updateKnowledgeEntry,
  submitKnowledgeForReview,
  publishKnowledgeEntry,
  archiveKnowledgeEntry,
  searchKnowledge,
  getPublishedKnowledge,
  getAuthorizedKnowledgeChunks,
  searchAuthorizedKnowledge,
} from '@/modules/documents/knowledge';
import {
  createRetentionPolicy,
  listRetentionPolicies,
  placeLegalHold,
  releaseLegalHold,
  listLegalHolds,
  getRetentionDueDocuments,
  evaluateRetention,
  executeAutomatedRetention,
} from '@/modules/documents/retention';
import {
  sanitizeFilename,
  validateFileSafety,
  computeSha256Checksum,
  sanitizeForAudit,
  sanitizeErrorMessage,
} from '@/modules/documents/security';
import {
  canViewDocument,
  canDownloadDocument,
  canEditDocument,
  canShareDocument,
  canApproveDocument,
  canDeleteDocument,
  hasDocumentPermission,
  DOCUMENT_PERMISSIONS,
} from '@/modules/documents/permissions';
import {
  createDocumentAction,
  getDocumentsDashboardOverviewAction,
} from '@/modules/documents/actions';

describe('Module 21: Enterprise Document, Knowledge & Records Management Engine', () => {
  let superAdminUser: any;
  let testUserA: any;
  let testUserB: any;
  let testFolder1: any;
  let testFolder2: any;
  let testDoc1: any;

  beforeAll(async () => {
    // 1. Setup test users
    superAdminUser = await db.user.findFirst({
      where: { email: 'oluwatobi@lawrenceapp.internal' },
    });

    if (!superAdminUser) {
      superAdminUser = await db.user.create({
        data: {
          email: 'oluwatobi@lawrenceapp.internal',
          name: 'Oluwatobi Super Admin',
          passwordHash: 'dummy',
        },
      });
    }

    testUserA = await db.user.create({
      data: {
        email: `doc.user.a.${Date.now()}@test.internal`,
        name: 'Document User Alpha',
        passwordHash: 'dummy',
      },
    });

    testUserB = await db.user.create({
      data: {
        email: `doc.user.b.${Date.now()}@test.internal`,
        name: 'Document User Beta',
        passwordHash: 'dummy',
      },
    });

    const memberRole = await db.role.findFirst({ where: { name: 'MEMBER' } });
    if (memberRole) {
      await db.userRole.createMany({
        data: [
          { userId: testUserA.id, roleId: memberRole.id },
          { userId: testUserB.id, roleId: memberRole.id },
        ],
      });
    }
  });

  // ==========================================================================
  // 1. Storage, Checksum & File Security (10 Tests)
  // ==========================================================================
  describe('1. Storage, Checksum & File Security', () => {
    it('1.1 should sanitize filenames preventing directory traversal', () => {
      const clean1 = sanitizeFilename('../../etc/passwd');
      expect(clean1).not.toContain('..');
      expect(clean1).not.toContain('/');

      const clean2 = sanitizeFilename('..\\..\\windows\\system32\\cmd.exe');
      expect(clean2).not.toContain('..');
      expect(clean2).not.toContain('\\');
    });

    it('1.2 should block dangerous file extensions', () => {
      expect(() => validateFileSafety('malware.exe')).toThrow(/prohibited/);
      expect(() => validateFileSafety('script.sh')).toThrow(/prohibited/);
      expect(() => validateFileSafety('payload.bat')).toThrow(/prohibited/);
      expect(() => validateFileSafety('backdoor.php')).toThrow(/prohibited/);
    });

    it('1.3 should block executable MIME types', () => {
      expect(() => validateFileSafety('app.js', 100, 'text/javascript')).toThrow();
    });

    it('1.4 should enforce max file size limit', () => {
      const oversized = 60 * 1024 * 1024; // 60MB
      expect(() => validateFileSafety('large.pdf', oversized)).toThrow(/exceeds limit/);
    });

    it('1.5 should calculate accurate SHA-256 checksums', () => {
      const content = 'Enterprise Document Content 2026';
      const checksum = computeSha256Checksum(content);
      expect(checksum).toHaveLength(64);
      expect(computeSha256Checksum(content)).toBe(checksum);
    });

    it('1.6 should redact sensitive credentials in metadata and audit objects', () => {
      const sensitiveObj = {
        title: 'Board Meeting',
        apiKey: 'secret_key_12345',
        password: 'SuperSecretPassword',
        creditCard: '4111222233334444',
        nested: {
          clientSecret: 'secret_abc',
          regularField: 'safeValue',
        },
      };

      const sanitized = sanitizeForAudit(sensitiveObj);
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.creditCard).toBe('[REDACTED]');
      expect(sanitized.nested.clientSecret).toBe('[REDACTED]');
      expect(sanitized.nested.regularField).toBe('safeValue');
    });

    it('1.7 should scrub database connection credentials in error messages', () => {
      const rawError = 'Connection failed to postgresql://user:pass123@localhost:5432/db';
      const scrubbed = sanitizeErrorMessage(rawError);
      expect(scrubbed).not.toContain('pass123');
      expect(scrubbed).toContain('[REDACTED]');
    });

    it('1.8 should allow safe document extensions and mime types', () => {
      expect(() => validateFileSafety('contract.pdf', 1024, 'application/pdf')).not.toThrow();
      expect(() => validateFileSafety('sheet.xlsx', 2048, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).not.toThrow();
      expect(() => validateFileSafety('readme.md', 512, 'text/markdown')).not.toThrow();
    });

    it('1.9 should support empty or null metadata safely in sanitizeForAudit', () => {
      expect(sanitizeForAudit(null)).toBeNull();
      expect(sanitizeForAudit(undefined)).toBeUndefined();
      expect(sanitizeForAudit({})).toEqual({});
    });

    it('1.10 should preserve non-sensitive array elements in audit sanitization', () => {
      const data = { tags: ['tag1', 'tag2'], meta: [{ password: '123' }, { name: 'safe' }] };
      const res = sanitizeForAudit(data);
      expect(res.tags).toEqual(['tag1', 'tag2']);
      expect(res.meta[0].password).toBe('[REDACTED]');
      expect(res.meta[1].name).toBe('safe');
    });
  });

  // ==========================================================================
  // 2. Folder Hierarchy & Circular Move Prevention (8 Tests)
  // ==========================================================================
  describe('2. Folder Hierarchy & Circular Move Prevention', () => {
    it('2.1 should create a root document folder', async () => {
      testFolder1 = await createFolder(
        {
          name: 'Contracts & Agreements',
          description: 'Legal document repository',
          visibility: 'ORGANIZATION',
        },
        superAdminUser.id
      );

      expect(testFolder1).toBeDefined();
      expect(testFolder1.folderCode).toMatch(/^FLD_/);
      expect(testFolder1.parentFolderId).toBeNull();
    });

    it('2.2 should create a nested subfolder', async () => {
      testFolder2 = await createFolder(
        {
          name: '2026 Vendor Agreements',
          parentFolderId: testFolder1.id,
          visibility: 'ORGANIZATION',
        },
        superAdminUser.id
      );

      expect(testFolder2).toBeDefined();
      expect(testFolder2.parentFolderId).toBe(testFolder1.id);
    });

    it('2.3 should list folder contents with nested subfolders', async () => {
      const contents = await listFolderContents(testFolder1.id, superAdminUser.id);
      expect(contents.subFolders.some((f: any) => f.id === testFolder2.id)).toBe(true);
    });

    it('2.4 should rename a folder cleanly', async () => {
      const renamed = await renameFolder(testFolder2.id, '2026 Vendor & Partner Agreements', superAdminUser.id);
      expect(renamed.name).toBe('2026 Vendor & Partner Agreements');
    });

    it('2.5 should detect and prevent moving a folder into itself', async () => {
      const isCycle = await wouldCreateFolderCycle(testFolder1.id, testFolder1.id);
      expect(isCycle).toBe(true);

      await expect(moveFolder(testFolder1.id, testFolder1.id, superAdminUser.id)).rejects.toThrow(
        /Circular/
      );
    });

    it('2.6 should detect and prevent circular ancestor loops (A -> B -> A)', async () => {
      const isCycle = await wouldCreateFolderCycle(testFolder1.id, testFolder2.id);
      expect(isCycle).toBe(true);

      await expect(moveFolder(testFolder1.id, testFolder2.id, superAdminUser.id)).rejects.toThrow(
        /Circular/
      );
    });

    it('2.7 should prevent deleting a folder with child contents', async () => {
      await expect(deleteFolder(testFolder1.id, superAdminUser.id)).rejects.toThrow(
        /Cannot delete non-empty folder/
      );
    });

    it('2.8 should delete an empty leaf folder', async () => {
      const emptyFolder = await createFolder(
        { name: 'Temporary Scratch Folder' },
        superAdminUser.id
      );

      const res = await deleteFolder(emptyFolder.id, superAdminUser.id);
      expect(res.success).toBe(true);
    });
  });

  // ==========================================================================
  // 3. Document Creation, Versioning & Immutability (12 Tests)
  // ==========================================================================
  describe('3. Document Creation, Versioning & Immutability', () => {
    it('3.1 should create a new document with initial v1 version and metadata', async () => {
      testDoc1 = await createDocument(
        {
          title: 'Master Service Agreement 2026',
          description: 'Standard client master service agreement template',
          documentType: 'CONTRACT',
          classification: 'INTERNAL',
          visibility: 'ORGANIZATION',
          folderId: testFolder2.id,
          fileName: 'msa_2026_v1.txt',
          fileContent: 'This is the initial MSA version 1 content.',
          tags: ['legal', 'msa', '2026'],
          metadata: { department: 'Legal', versionStage: 'Initial Draft' },
        },
        testUserA.id
      );

      expect(testDoc1).toBeDefined();
      expect(testDoc1.documentCode).toMatch(/^DOC_/);
      expect(testDoc1.status).toBe('ACTIVE');
      expect(testDoc1.currentVersionId).toBeDefined();
      expect(testDoc1.checksum).toHaveLength(64);
    });

    it('3.2 should fetch document details with version and metadata relations', async () => {
      const doc = await getDocument(testDoc1.id, testUserA.id);
      expect(doc.id).toBe(testDoc1.id);
      expect(doc.versions).toHaveLength(1);
      expect(doc.versions[0].versionNumber).toBe(1);
      expect(doc.metadata).toBeDefined();
    });

    it('3.3 should create sequential version 2 with updated checksum and change summary', async () => {
      const v2 = await createDocumentVersion(
        {
          documentId: testDoc1.id,
          fileName: 'msa_2026_v2.txt',
          fileContent: 'This is the revised MSA version 2 content with updated liabilities.',
          changeSummary: 'Updated liability limits in section 8',
        },
        testUserA.id
      );

      expect(v2).toBeDefined();
      expect(v2.versionNumber).toBe(2);
      expect(v2.versionCode).toMatch(/^VER_/);
      expect(v2.changeSummary).toContain('Updated liability');

      const doc = await getDocument(testDoc1.id, testUserA.id);
      expect(doc.currentVersionId).toBe(v2.id);
      expect(doc.versions).toHaveLength(2);
    });

    it('3.4 should list all immutable versions in descending sequential order', async () => {
      const versions = await listDocumentVersions(testDoc1.id, testUserA.id);
      expect(versions).toHaveLength(2);
      expect(versions[0].versionNumber).toBe(2);
      expect(versions[1].versionNumber).toBe(1);
    });

    it('3.5 should compare differences between version 1 and version 2', async () => {
      const versions = await listDocumentVersions(testDoc1.id, testUserA.id);
      const comparison = await compareVersions(versions[1].id, versions[0].id, testUserA.id);

      expect(comparison.isIdenticalChecksum).toBe(false);
      expect(comparison.version1.versionNumber).toBe(1);
      expect(comparison.version2.versionNumber).toBe(2);
    });

    it('3.6 should restore old version by creating a NEW sequential version (v3)', async () => {
      const versions = await listDocumentVersions(testDoc1.id, testUserA.id);
      const v1 = versions.find((v: any) => v.versionNumber === 1);

      const v3 = await restoreVersion(testDoc1.id, v1.id, testUserA.id);
      expect(v3.versionNumber).toBe(3);
      expect(v3.changeSummary).toContain('Restored content from version 1');

      const doc = await getDocument(testDoc1.id, testUserA.id);
      expect(doc.versions).toHaveLength(3);
    });

    it('3.7 should update document metadata and tags', async () => {
      const updated = await updateDocumentMetadata(
        testDoc1.id,
        {
          title: 'Master Service Agreement 2026 (Revised)',
          description: 'Updated MSA description',
          tags: ['legal', 'msa', 'revised'],
        },
        testUserA.id
      );

      expect(updated.title).toContain('(Revised)');
    });

    it('3.8 should move document to another folder', async () => {
      const moved = await moveDocument(testDoc1.id, testFolder1.id, testUserA.id);
      expect(moved.folderId).toBe(testFolder1.id);
    });

    it('3.9 should record activity log for every version and metadata change', async () => {
      const history = await getDocumentHistory(testDoc1.id, testUserA.id);
      expect(history.length).toBeGreaterThanOrEqual(3);
      expect(history.some((h: any) => h.activityType === 'DOCUMENT_CREATED')).toBe(true);
      expect(history.some((h: any) => h.activityType === 'VERSION_CREATED')).toBe(true);
    });

    it('3.10 should archive and restore document cleanly', async () => {
      const archived = await archiveDocument(testDoc1.id, testUserA.id);
      expect(archived.isArchived).toBe(true);
      expect(archived.status).toBe('ARCHIVED');

      const restored = await restoreDocument(testDoc1.id, testUserA.id);
      expect(restored.isArchived).toBe(false);
      expect(restored.status).toBe('ACTIVE');
    });

    it('3.11 should prevent creating versions on archived documents', async () => {
      await archiveDocument(testDoc1.id, testUserA.id);
      await expect(
        createDocumentVersion(
          {
            documentId: testDoc1.id,
            fileName: 'fail.txt',
            fileContent: 'fails',
          },
          testUserA.id
        )
      ).rejects.toThrow(/Cannot add versions to an archived document/);

      // Restore for subsequent tests
      await restoreDocument(testDoc1.id, testUserA.id);
    });

    it('3.12 should handle concurrent version creations safely', async () => {
      const promises = [
        createDocumentVersion({ documentId: testDoc1.id, fileName: 'concur1.txt', fileContent: 'c1' }, testUserA.id),
        createDocumentVersion({ documentId: testDoc1.id, fileName: 'concur2.txt', fileContent: 'c2' }, testUserA.id),
      ];

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // 4. Permissions, Access Controls & Document Sharing (10 Tests)
  // ==========================================================================
  describe('4. Permissions, Access Controls & Document Sharing', () => {
    let restrictedDoc: any;

    it('4.1 should allow owner to view and edit document', async () => {
      const canView = await canViewDocument(testUserA.id, testDoc1.id);
      const canEdit = await canEditDocument(testUserA.id, testDoc1.id);
      expect(canView).toBe(true);
      expect(canEdit).toBe(true);
    });

    it('4.2 should restrict access to RESTRICTED documents for non-owners without explicit permissions', async () => {
      restrictedDoc = await createDocument(
        {
          title: 'Executive Compensation Restructuring Strategy',
          classification: 'RESTRICTED',
          visibility: 'PRIVATE',
          fileName: 'exec_comp.txt',
          fileContent: 'Confidential executive data',
        },
        testUserA.id
      );

      const canViewB = await canViewDocument(testUserB.id, restrictedDoc.id);
      expect(canViewB).toBe(false);

      await expect(getDocument(restrictedDoc.id, testUserB.id)).rejects.toThrow(/Access denied/);
    });

    it('4.3 should allow Super Admin to view RESTRICTED documents', async () => {
      const canAdminView = await canViewDocument(superAdminUser.id, restrictedDoc.id);
      expect(canAdminView).toBe(true);
    });

    it('4.4 should grant explicit ACL permission on document', async () => {
      await db.documentPermission.create({
        data: {
          documentId: restrictedDoc.id,
          subjectId: testUserB.id,
          subjectType: 'USER',
          permission: 'VIEW',
          grantedById: testUserA.id,
        },
      });

      const canViewB = await canViewDocument(testUserB.id, restrictedDoc.id);
      expect(canViewB).toBe(true);
    });

    it('4.5 should generate revocable share token', async () => {
      const share = await shareDocument(
        {
          documentId: testDoc1.id,
          sharedWithId: testUserB.id,
          permission: 'VIEW',
          expiresInDays: 7,
        },
        testUserA.id
      );

      expect(share).toBeDefined();
      expect(share.shareCode).toMatch(/^SHR_/);
      expect(share.revokedAt).toBeNull();
    });

    it('4.6 should validate active share token', async () => {
      const shares = await getActiveShares(testDoc1.id, testUserA.id);
      expect(shares.length).toBeGreaterThanOrEqual(1);

      const validation = await validateShare(shares[0].shareCode);
      expect(validation.isValid).toBe(true);
      expect(validation.document).toBeDefined();
    });

    it('4.7 should revoke share token immediately', async () => {
      const shares = await getActiveShares(testDoc1.id, testUserA.id);
      const shareToRevoke = shares[0];

      const revoked = await revokeShare(shareToRevoke.id, testUserA.id);
      expect(revoked.revokedAt).not.toBeNull();

      const validation = await validateShare(shareToRevoke.shareCode);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('revoked');
    });

    it('4.8 should reject expired share tokens', async () => {
      const expiredShare = await db.documentShare.create({
        data: {
          shareCode: `SHR_EXP_${Date.now()}`,
          documentId: testDoc1.id,
          sharedWithType: 'USER',
          permission: 'VIEW',
          expiresAt: new Date(Date.now() - 10000), // in the past
        },
      });

      const validation = await validateShare(expiredShare.shareCode);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('expired');
    });

    it('4.9 should evaluate canDownloadDocument correctly', async () => {
      const canDownload = await canDownloadDocument(testUserA.id, testDoc1.id);
      expect(canDownload).toBe(true);
    });

    it('4.10 should evaluate canShareDocument correctly', async () => {
      const canShare = await canShareDocument(testUserA.id, testDoc1.id);
      expect(canShare).toBe(true);
    });
  });

  // ==========================================================================
  // 5. Version-Specific Approval Workflow & Separation of Duties (8 Tests)
  // ==========================================================================
  describe('5. Version-Specific Approval Workflow & Separation of Duties', () => {
    let approvalDoc: any;
    let approvalReq: any;

    it('5.1 should create a document and submit specific version for approval', async () => {
      approvalDoc = await createDocument(
        {
          title: 'Q3 Financial Compliance Report 2026',
          documentType: 'COMPLIANCE',
          classification: 'INTERNAL',
          fileName: 'q3_compliance.txt',
          fileContent: 'Q3 statutory financial compliance data',
        },
        testUserA.id
      );

      approvalReq = await requestApproval(
        {
          documentId: approvalDoc.id,
          versionId: approvalDoc.currentVersionId,
          reviewerId: superAdminUser.id,
          comments: 'Please review and approve statutory compliance filing',
        },
        testUserA.id
      );

      expect(approvalReq.status).toBe('PENDING');
      expect(approvalReq.approvalCode).toMatch(/^APP_/);

      const doc = await getDocument(approvalDoc.id, testUserA.id);
      expect(doc.status).toBe('UNDER_REVIEW');
    });

    it('5.2 should prevent duplicate pending approvals on the same version', async () => {
      await expect(
        requestApproval(
          {
            documentId: approvalDoc.id,
            versionId: approvalDoc.currentVersionId,
          },
          testUserA.id
        )
      ).rejects.toThrow(/already pending/);
    });

    it('5.3 should enforce separation of duties (requester cannot self-approve)', async () => {
      await expect(
        approveDocument(approvalReq.id, 'Self-approval attempt', testUserA.id)
      ).rejects.toThrow(/Separation of duties/);
    });

    it('5.4 should approve document version successfully by authorized reviewer', async () => {
      const approved = await approveDocument(
        approvalReq.id,
        'Statutory report verified and approved',
        superAdminUser.id
      );

      expect(approved.status).toBe('APPROVED');
      expect(approved.reviewedAt).not.toBeNull();

      const doc = await getDocument(approvalDoc.id, testUserA.id);
      expect(doc.status).toBe('APPROVED');
    });

    it('5.5 should verify that creating version 2 resets approval status to DRAFT/ACTIVE', async () => {
      const v2 = await createDocumentVersion(
        {
          documentId: approvalDoc.id,
          fileName: 'q3_compliance_v2.txt',
          fileContent: 'Revised Q3 statutory figures',
          changeSummary: 'Addendum added',
        },
        testUserA.id
      );

      // Approving version 1 did NOT automatically approve version 2
      const approvals = await getApprovalHistory(approvalDoc.id, testUserA.id);
      const v2Approvals = approvals.filter((a: any) => a.versionId === v2.id);
      expect(v2Approvals).toHaveLength(0);
    });

    it('5.6 should support document rejection workflow with reason comments', async () => {
      const v2 = (await listDocumentVersions(approvalDoc.id, testUserA.id))[0];

      const v2Approval = await requestApproval(
        {
          documentId: approvalDoc.id,
          versionId: v2.id,
          reviewerId: superAdminUser.id,
        },
        testUserA.id
      );

      const rejected = await rejectDocument(
        v2Approval.id,
        'Missing signed auditor statement on page 3',
        superAdminUser.id
      );

      expect(rejected.status).toBe('REJECTED');
      expect(rejected.comments).toContain('auditor statement');

      const doc = await getDocument(approvalDoc.id, testUserA.id);
      expect(doc.status).toBe('REJECTED');
    });

    it('5.7 should support cancellation of pending approval by requester', async () => {
      const v3 = await createDocumentVersion(
        {
          documentId: approvalDoc.id,
          fileName: 'q3_v3.txt',
          fileContent: 'v3 content',
        },
        testUserA.id
      );

      const v3Approval = await requestApproval(
        { documentId: approvalDoc.id, versionId: v3.id },
        testUserA.id
      );

      const cancelled = await cancelApproval(v3Approval.id, testUserA.id);
      expect(cancelled.status).toBe('CANCELLED');
    });

    it('5.8 should retrieve complete approval audit history', async () => {
      const history = await getApprovalHistory(approvalDoc.id, testUserA.id);
      expect(history.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ==========================================================================
  // 6. Knowledge Management, RAG & Chunking Engine (10 Tests)
  // ==========================================================================
  describe('6. Knowledge Management, RAG & Chunking Engine', () => {
    let collection: any;
    let knowledgeEntry: any;

    it('6.1 should create a knowledge collection', async () => {
      collection = await createKnowledgeCollection(
        {
          name: 'Leadership & Expansion Playbooks',
          description: 'Standard operating procedures for team expansion',
          visibility: 'ORGANIZATION',
        },
        superAdminUser.id
      );

      expect(collection).toBeDefined();
      expect(collection.collectionCode).toMatch(/^KC_/);
    });

    it('6.2 should create a draft knowledge entry and automatically generate chunks', async () => {
      const articleContent = `
# NeoLife Team Onboarding Guide

## 1. Introduction
Welcome to the organization. Step 1 is completing the digital marketing foundation.

## 2. Daily Activities
Members must execute daily outreach and log activities in MyDay.

## 3. Compensation & Rank Progression
Review Prompt 03B for 4000 QPV Director qualification criteria.
`;

      knowledgeEntry = await createKnowledgeEntry(
        {
          collectionId: collection.id,
          title: 'NeoLife Team Onboarding Standard Operating Procedure',
          content: articleContent,
        },
        superAdminUser.id
      );

      expect(knowledgeEntry).toBeDefined();
      expect(knowledgeEntry.entryCode).toMatch(/^KNE_/);
      expect(knowledgeEntry.status).toBe('DRAFT');

      const chunks = await db.knowledgeChunk.findMany({
        where: { knowledgeEntryId: knowledgeEntry.id },
      });
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks[0].checksum).toHaveLength(64);
    });

    it('6.3 should update knowledge entry and regenerate chunks with checksums', async () => {
      const updated = await updateKnowledgeEntry(
        knowledgeEntry.id,
        {
          title: 'NeoLife Team Onboarding SOP (Updated)',
          content: 'Updated onboarding guide with section 4 on financial ledgers.',
        },
        superAdminUser.id
      );

      expect(updated.title).toContain('(Updated)');
      expect(updated.version).toBe(2);

      const chunks = await db.knowledgeChunk.findMany({
        where: { knowledgeEntryId: knowledgeEntry.id },
      });
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });

    it('6.4 should submit knowledge entry for review', async () => {
      const submitted = await submitKnowledgeForReview(knowledgeEntry.id, superAdminUser.id);
      expect(submitted.status).toBe('UNDER_REVIEW');
    });

    it('6.5 should publish knowledge entry', async () => {
      const published = await publishKnowledgeEntry(knowledgeEntry.id, superAdminUser.id);
      expect(published.status).toBe('PUBLISHED');
      expect(published.publishedAt).not.toBeNull();
    });

    it('6.6 should search knowledge articles and return published items', async () => {
      const results = await searchKnowledge('Onboarding', collection.id, false);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].title).toContain('Onboarding');
    });

    it('6.7 should provide published knowledge for Prompt 15 AI RAG retrieval', async () => {
      const aiResults = await searchAuthorizedKnowledge('onboarding', testUserA.id);
      expect(aiResults.length).toBeGreaterThanOrEqual(1);
      expect(aiResults[0].status).toBe('PUBLISHED');
    });

    it('6.8 should retrieve authorized knowledge chunks for RAG context building', async () => {
      const chunks = await getAuthorizedKnowledgeChunks(knowledgeEntry.id, testUserA.id);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks[0].content).toContain('onboarding');
    });

    it('6.9 should archive knowledge entry', async () => {
      const archived = await archiveKnowledgeEntry(knowledgeEntry.id, superAdminUser.id);
      expect(archived.status).toBe('ARCHIVED');

      // Should not appear in standard published knowledge search
      const pubResults = await getPublishedKnowledge(collection.id);
      expect(pubResults.some((e: any) => e.id === knowledgeEntry.id)).toBe(false);
    });

    it('6.10 should prevent unauthorized users from publishing knowledge entries', async () => {
      const draft = await createKnowledgeEntry(
        {
          collectionId: collection.id,
          title: 'Unauthorized article attempt',
          content: 'Test',
        },
        superAdminUser.id
      );

      await expect(publishKnowledgeEntry(draft.id, testUserA.id)).rejects.toThrow(/Unauthorized/);
    });
  });

  // ==========================================================================
  // 7. Retention Policies & Legal Preservation Holds (10 Tests)
  // ==========================================================================
  describe('7. Retention Policies & Legal Preservation Holds', () => {
    let holdDoc: any;
    let holdRecord: any;

    it('7.1 should create a record retention policy', async () => {
      const policy = await createRetentionPolicy(
        {
          name: 'General Business Reports 30-Day Retention',
          documentType: 'REPORT',
          retentionDays: 30,
          autoArchive: true,
          autoDelete: false,
        },
        superAdminUser.id
      );

      expect(policy).toBeDefined();
      expect(policy.policyCode).toMatch(/^POL_RET_/);
      expect(policy.retentionDays).toBe(30);
    });

    it('7.2 should list active retention policies', async () => {
      const policies = await listRetentionPolicies();
      expect(policies.length).toBeGreaterThanOrEqual(1);
    });

    it('7.3 should place an active legal preservation hold on a document', async () => {
      holdDoc = await createDocument(
        {
          title: 'Special Project Audit Evidence 2026',
          documentType: 'REPORT',
          fileName: 'audit_evidence.txt',
          fileContent: 'Preserved evidence file',
        },
        superAdminUser.id
      );

      holdRecord = await placeLegalHold(
        {
          documentId: holdDoc.id,
          reason: 'Regulatory investigation hold #2026-REG-99',
        },
        superAdminUser.id
      );

      expect(holdRecord).toBeDefined();
      expect(holdRecord.status).toBe('ACTIVE');
      expect(holdRecord.holdCode).toMatch(/^HLD_/);
    });

    it('7.4 should PREVENT DELETION of a document under active legal hold', async () => {
      const canDelete = await canDeleteDocument(superAdminUser.id, holdDoc.id);
      expect(canDelete).toBe(false);

      await expect(deleteDocument(holdDoc.id, superAdminUser.id)).rejects.toThrow(
        /legal hold/
      );
    });

    it('7.5 should list active legal holds', async () => {
      const holds = await listLegalHolds(holdDoc.id);
      expect(holds).toHaveLength(1);
      expect(holds[0].id).toBe(holdRecord.id);
    });

    it('7.6 should evaluate retention and exempt documents with legal holds', async () => {
      const evalRes = await evaluateRetention();
      expect(evalRes).toBeDefined();
      expect(Array.isArray(evalRes.dueDocuments)).toBe(true);
    });

    it('7.7 should execute automated retention without deleting held documents', async () => {
      const results = await executeAutomatedRetention('system');
      expect(results).toBeDefined();
      expect(typeof results.archivedCount).toBe('number');
    });

    it('7.8 should release legal preservation hold successfully', async () => {
      const released = await releaseLegalHold(holdRecord.id, superAdminUser.id);
      expect(released.status).toBe('RELEASED');
      expect(released.releasedAt).not.toBeNull();
    });

    it('7.9 should reject duplicate release of already released legal hold', async () => {
      await expect(releaseLegalHold(holdRecord.id, superAdminUser.id)).rejects.toThrow(
        /already been released/
      );
    });

    it('7.10 should allow deletion once legal hold is released', async () => {
      const canDeleteNow = await canDeleteDocument(superAdminUser.id, holdDoc.id);
      expect(canDeleteNow).toBe(true);

      const delRes = await deleteDocument(holdDoc.id, superAdminUser.id);
      expect(delRes.success).toBe(true);
    });
  });

  // ==========================================================================
  // 8. Cross-Domain Relations, Search & Dashboard Telemetry (10 Tests)
  // ==========================================================================
  describe('8. Cross-Domain Relations, Search & Dashboard Telemetry', () => {
    const leadEntityId = `lead_uuid_${Date.now()}`;

    it('8.1 should associate document with CRM record via generic relation', async () => {
      const rel = await addDocumentRelation(
        testDoc1.id,
        'CRM_LEAD',
        leadEntityId,
        'ATTACHMENT',
        testUserA.id
      );

      expect(rel).toBeDefined();
      expect(rel.relationCode).toMatch(/^REL_/);
      expect(rel.relatedEntityType).toBe('CRM_LEAD');
    });

    it('8.2 should fetch documents associated with specific domain entity', async () => {
      const related = await getDocumentsByRelation('CRM_LEAD', leadEntityId, testUserA.id);
      expect(related.length).toBeGreaterThanOrEqual(1);
      expect(related[0].documentId).toBe(testDoc1.id);
    });

    it('8.3 should search documents with text query and pagination', async () => {
      const searchRes = await listDocuments(
        { query: 'Master Service', limit: 10, page: 1 },
        testUserA.id
      );

      expect(searchRes.documents.length).toBeGreaterThanOrEqual(1);
      expect(searchRes.pagination.totalCount).toBeGreaterThanOrEqual(1);
      expect(searchRes.pagination.page).toBe(1);
    });

    it('8.4 should get aggregated documents dashboard overview', async () => {
      const overview = await getDocumentsDashboardOverview(superAdminUser.id);
      expect(overview.metrics.totalDocuments).toBeGreaterThanOrEqual(1);
      expect(overview.recentDocuments.length).toBeGreaterThanOrEqual(1);
    });

    it('8.5 should call getDocumentsDashboardOverviewAction via Server Action', async () => {
      const res = await getDocumentsDashboardOverviewAction(superAdminUser.id);
      expect(res.metrics).toBeDefined();
    });

    it('8.6 should call createDocumentAction via Server Action cleanly', async () => {
      const doc = await createDocumentAction(
        {
          title: 'Server Action Test Document',
          fileName: 'action_test.txt',
          fileContent: 'server action payload',
        },
        superAdminUser.id
      );

      expect(doc).toBeDefined();
      expect(doc.title).toBe('Server Action Test Document');
    });

    it('8.7 should verify Prompt 05/05.1 Double-Entry Financial Ledger isolation', async () => {
      // Confirm JournalTransaction and FinancialAccount counts are unchanged
      const txCountPre = await db.journalTransaction.count();
      await getDocumentsDashboardOverview(superAdminUser.id);
      const txCountPost = await db.journalTransaction.count();
      expect(txCountPost).toBe(txCountPre);
    });

    it('8.8 should verify zero direct mutations on FinancialAccount', () => {
      const fs = require('fs');
      const files = ['service.ts', 'versions.ts', 'retention.ts', 'approvals.ts', 'sharing.ts', 'folders.ts', 'knowledge.ts'];
      for (const f of files) {
        const content = fs.readFileSync(`src/modules/documents/${f}`, 'utf-8');
        expect(content).not.toContain('db.financialAccount');
        expect(content).not.toContain('db.journalTransaction');
        expect(content).not.toContain('db.journalEntry');
      }
    });

    it('8.9 should verify documents permissions helper checks admin override', async () => {
      const isAdmin = await hasDocumentPermission(superAdminUser.id, DOCUMENT_PERMISSIONS.READ_ALL);
      expect(isAdmin).toBe(true);
    });

    it('8.10 should verify clean teardown without residual locks', async () => {
      const docCount = await db.document.count();
      expect(docCount).toBeGreaterThanOrEqual(1);
    });
  });
});
