import type { CollaboratorRole, CollaboratorStatus } from '@verso/shared';

export type SongAction =
  | 'read'
  | 'edit_lyrics'
  | 'manage_audio'
  | 'comment'
  | 'resolve_comment'
  | 'manage_collaborators'
  | 'edit_credits'
  | 'delete'
  | 'leave';

export type AlbumAction =
  'read' | 'edit' | 'manage_tracks' | 'manage_collaborators' | 'delete' | 'leave';

export type CommentAction = 'reply' | 'resolve' | 'reopen' | 'delete';

export type InvitationAction = 'revoke' | 'respond';

export type UserAction = 'block' | 'unblock' | 'report';

export interface CollaboratorRecord {
  userId: string;
  role: CollaboratorRole;
  status: CollaboratorStatus;
}

export interface SongContext {
  id: string;
  userId: string; // Propriétaire
  albumId?: string | null;
  collaborators?: CollaboratorRecord[];
  album?: {
    id: string;
    userId: string;
    collaborators?: CollaboratorRecord[];
  } | null;
}

export interface AlbumContext {
  id: string;
  userId: string; // Propriétaire
  collaborators?: CollaboratorRecord[];
}

export interface CommentContext {
  id: string;
  authorId: string;
  songId: string;
  song: SongContext;
}

export interface InvitationContext {
  id: string;
  inviterId: string;
  invitedUserId?: string | null;
  invitedEmail?: string | null;
  songId?: string | null;
  albumId?: string | null;
  song?: SongContext | null;
  album?: AlbumContext | null;
}

export interface UserTargetContext {
  targetUserId: string;
}

export type ResourceTarget =
  | { type: 'song'; data: SongContext }
  | { type: 'song'; id: string }
  | { type: 'album'; data: AlbumContext }
  | { type: 'album'; id: string }
  | { type: 'comment'; data: CommentContext }
  | { type: 'comment'; id: string }
  | { type: 'invitation'; data: InvitationContext }
  | { type: 'invitation'; id: string }
  | { type: 'user'; data: UserTargetContext }
  | { type: 'user'; id: string };

export type PermissionAction =
  SongAction | AlbumAction | CommentAction | InvitationAction | UserAction;
