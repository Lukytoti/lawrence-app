export type MemberStatus =
  | 'PROSPECT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'AT_RISK'
  | 'EXITED'
  | 'ARCHIVED';

export interface NetworkMemberSummary {
  id: string;
  memberCode: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  phone?: string | null;
  status: MemberStatus;
  joinedAt: Date | string;
  activatedAt?: Date | string | null;
  exitedAt?: Date | string | null;
  exitReason?: string | null;
  archivedAt?: Date | string | null;
  roleName?: string;
  directDownlineCount: number;
  totalDownlineCount: number;
  sponsor?: {
    id: string;
    memberCode: string;
    name: string;
    email: string;
  } | null;
}

export interface NetworkMemberNode extends NetworkMemberSummary {
  hasChildren: boolean;
  children?: NetworkMemberNode[];
}

export interface UplineChainItem {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  status: MemberStatus;
  level: number; // 1 = Direct Sponsor, 2 = Grand Sponsor...
  effectiveFrom: Date | string;
}

export interface OrgHistoryItem {
  id: string;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string | null;
  reason?: string | null;
  sponsor?: {
    id: string;
    memberCode: string;
    name: string;
    email: string;
  } | null;
  createdBy?: string | null;
}

export interface CreateMemberPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  sponsorId: string; // Required existing sponsor
  status?: MemberStatus;
  joinedAt?: string;
}

export interface MoveMemberPayload {
  memberId: string;
  newSponsorId: string;
  reason: string;
}

export interface ExitMemberPayload {
  memberId: string;
  exitReason: string;
}

export interface OrgMetricsSummary {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  exitedMembers: number;
  directDownlineCount: number;
  totalOrganizationCount: number;
}
