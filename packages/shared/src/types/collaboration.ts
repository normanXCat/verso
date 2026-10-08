import type {
  CollaboratorRole,
  CollaboratorStatus,
  InvitationStatus,
} from '../schemas/collaboration.js';
import type { CreditRole } from '../schemas/credit.js';
import type { ReportReason, ReportStatus } from '../schemas/moderation.js';
import type { NotificationType } from '../schemas/notification.js';

export interface PublicUserSummary {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface UserProfilePublic extends PublicUserSummary {
  bio: string | null;
}

export interface CollaboratorItem {
  id: string;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  userId: string;
  user: PublicUserSummary;
  songId?: string | null;
  albumId?: string | null;
  invitedById: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface InvitationItem {
  id: string;
  role: CollaboratorRole;
  status: InvitationStatus;
  invitedEmail?: string | null;
  invitedUserId?: string | null;
  invitedUser?: PublicUserSummary | null;
  inviterId: string;
  inviter: PublicUserSummary;
  songId?: string | null;
  songTitle?: string | null;
  song?: { id: string; title: string } | null;
  albumId?: string | null;
  albumTitle?: string | null;
  album?: { id: string; title: string } | null;
  expiresAt: string | Date;
  createdAt: string | Date;
}

export interface CommentItem {
  id: string;
  content: string;
  startLine: number;
  endLine: number;
  songId: string;
  authorId: string;
  author: PublicUserSummary;
  parentId?: string | null;
  replies?: CommentItem[];
  isResolved: boolean;
  resolvedById?: string | null;
  resolvedBy?: PublicUserSummary | null;
  resolvedAt?: string | Date | null;
  isAnonymized: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  isRead: boolean;
  recipientId: string;
  actorId?: string | null;
  actor?: PublicUserSummary | null;
  songId?: string | null;
  songTitle?: string | null;
  albumId?: string | null;
  albumTitle?: string | null;
  commentId?: string | null;
  invitationId?: string | null;
  createdAt: string | Date;
}

export interface CreditItem {
  id: string;
  name: string;
  role: CreditRole;
  percentage?: number | null;
  order: number;
  songId: string;
  userId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SharedWorkItem {
  id: string;
  type: 'song' | 'album';
  title: string;
  role: CollaboratorRole;
  owner: PublicUserSummary;
  updatedAt: string | Date;
  trackCount?: number;
}

export interface SongActivityItem {
  id: string;
  action: 'create' | 'edit' | 'restore' | 'comment' | 'resolve' | 'invite' | 'leave';
  details: string;
  actor: PublicUserSummary;
  timestamp: string | Date;
}

export interface AbuseReportItem {
  id: string;
  reason: ReportReason;
  details?: string | null;
  status: ReportStatus;
  reporterId: string;
  reporter?: PublicUserSummary;
  reportedUserId?: string | null;
  reportedUser?: PublicUserSummary | null;
  songId?: string | null;
  commentId?: string | null;
  createdAt: string | Date;
}
