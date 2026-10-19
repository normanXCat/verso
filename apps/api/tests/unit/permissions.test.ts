import { describe, expect, it } from 'vitest';
import {
  assertCan,
  can,
  evaluateAlbumAction,
  evaluateCommentAction,
  evaluateInvitationAction,
  evaluateSongAction,
  evaluateUserAction,
  NotFoundAccessError,
} from '../../src/modules/permissions/permissions.service.js';
import type {
  AlbumContext,
  CommentContext,
  InvitationContext,
  SongContext,
} from '../../src/modules/permissions/permissions.types.js';

describe('Permissions Engine - can(user, resource, action)', () => {
  const ownerId = 'usr_owner_1';
  const coAuthorId = 'usr_coauthor_1';
  const commenterId = 'usr_commenter_1';
  const readerId = 'usr_reader_1';
  const revokedId = 'usr_revoked_1';
  const strangerId = 'usr_stranger_1';

  const baseSong: SongContext = {
    id: 'sng_1',
    userId: ownerId,
    collaborators: [
      { userId: coAuthorId, role: 'CO_AUTHOR', status: 'ACTIVE' },
      { userId: commenterId, role: 'COMMENTER', status: 'ACTIVE' },
      { userId: readerId, role: 'READER', status: 'ACTIVE' },
      { userId: revokedId, role: 'CO_AUTHOR', status: 'REVOKED' },
    ],
  };

  describe('Song Permissions - Direct Collaborations', () => {
    it('grants full ownership permissions to song owner, excluding leave', () => {
      expect(evaluateSongAction(ownerId, baseSong, 'read')).toBe(true);
      expect(evaluateSongAction(ownerId, baseSong, 'edit_lyrics')).toBe(true);
      expect(evaluateSongAction(ownerId, baseSong, 'manage_audio')).toBe(true);
      expect(evaluateSongAction(ownerId, baseSong, 'comment')).toBe(true);
      expect(evaluateSongAction(ownerId, baseSong, 'resolve_comment')).toBe(true);
      expect(evaluateSongAction(ownerId, baseSong, 'manage_collaborators')).toBe(true);
      expect(evaluateSongAction(ownerId, baseSong, 'edit_credits')).toBe(true);
      expect(evaluateSongAction(ownerId, baseSong, 'delete')).toBe(true);
      expect(evaluateSongAction(ownerId, baseSong, 'leave')).toBe(false);
    });

    it('grants co-author appropriate write, audio, comments, credits, leave, but denies admin', () => {
      expect(evaluateSongAction(coAuthorId, baseSong, 'read')).toBe(true);
      expect(evaluateSongAction(coAuthorId, baseSong, 'edit_lyrics')).toBe(true);
      expect(evaluateSongAction(coAuthorId, baseSong, 'manage_audio')).toBe(true);
      expect(evaluateSongAction(coAuthorId, baseSong, 'comment')).toBe(true);
      expect(evaluateSongAction(coAuthorId, baseSong, 'resolve_comment')).toBe(true);
      expect(evaluateSongAction(coAuthorId, baseSong, 'edit_credits')).toBe(true);
      expect(evaluateSongAction(coAuthorId, baseSong, 'leave')).toBe(true);

      // Actions interdites aux co-auteurs (FR-002)
      expect(evaluateSongAction(coAuthorId, baseSong, 'manage_collaborators')).toBe(false);
      expect(evaluateSongAction(coAuthorId, baseSong, 'delete')).toBe(false);
    });

    it('grants commenter read, comment, and leave only', () => {
      expect(evaluateSongAction(commenterId, baseSong, 'read')).toBe(true);
      expect(evaluateSongAction(commenterId, baseSong, 'comment')).toBe(true);
      expect(evaluateSongAction(commenterId, baseSong, 'leave')).toBe(true);

      expect(evaluateSongAction(commenterId, baseSong, 'edit_lyrics')).toBe(false);
      expect(evaluateSongAction(commenterId, baseSong, 'manage_audio')).toBe(false);
      expect(evaluateSongAction(commenterId, baseSong, 'resolve_comment')).toBe(false);
      expect(evaluateSongAction(commenterId, baseSong, 'edit_credits')).toBe(false);
      expect(evaluateSongAction(commenterId, baseSong, 'manage_collaborators')).toBe(false);
      expect(evaluateSongAction(commenterId, baseSong, 'delete')).toBe(false);
    });

    it('grants reader read and leave only', () => {
      expect(evaluateSongAction(readerId, baseSong, 'read')).toBe(true);
      expect(evaluateSongAction(readerId, baseSong, 'leave')).toBe(true);

      expect(evaluateSongAction(readerId, baseSong, 'comment')).toBe(false);
      expect(evaluateSongAction(readerId, baseSong, 'edit_lyrics')).toBe(false);
      expect(evaluateSongAction(readerId, baseSong, 'manage_audio')).toBe(false);
      expect(evaluateSongAction(readerId, baseSong, 'resolve_comment')).toBe(false);
      expect(evaluateSongAction(readerId, baseSong, 'edit_credits')).toBe(false);
      expect(evaluateSongAction(readerId, baseSong, 'manage_collaborators')).toBe(false);
      expect(evaluateSongAction(readerId, baseSong, 'delete')).toBe(false);
    });

    it('denies all actions to revoked collaborator and stranger', () => {
      for (const user of [revokedId, strangerId]) {
        expect(evaluateSongAction(user, baseSong, 'read')).toBe(false);
        expect(evaluateSongAction(user, baseSong, 'edit_lyrics')).toBe(false);
        expect(evaluateSongAction(user, baseSong, 'manage_audio')).toBe(false);
        expect(evaluateSongAction(user, baseSong, 'comment')).toBe(false);
        expect(evaluateSongAction(user, baseSong, 'resolve_comment')).toBe(false);
        expect(evaluateSongAction(user, baseSong, 'manage_collaborators')).toBe(false);
        expect(evaluateSongAction(user, baseSong, 'edit_credits')).toBe(false);
        expect(evaluateSongAction(user, baseSong, 'delete')).toBe(false);
        expect(evaluateSongAction(user, baseSong, 'leave')).toBe(false);
      }
    });
  });

  describe('Song Permissions - Album Inheritance (FR-010)', () => {
    const albumOwnerId = 'usr_album_owner';
    const albumCoAuthorId = 'usr_album_coauthor';
    const albumCommenterId = 'usr_album_commenter';

    const songWithAlbum: SongContext = {
      id: 'sng_2',
      userId: ownerId,
      albumId: 'alb_1',
      collaborators: [],
      album: {
        id: 'alb_1',
        userId: albumOwnerId,
        collaborators: [
          { userId: albumCoAuthorId, role: 'CO_AUTHOR', status: 'ACTIVE' },
          { userId: albumCommenterId, role: 'COMMENTER', status: 'ACTIVE' },
        ],
      },
    };

    it('grants album owner full access to song in album', () => {
      expect(evaluateSongAction(albumOwnerId, songWithAlbum, 'read')).toBe(true);
      expect(evaluateSongAction(albumOwnerId, songWithAlbum, 'edit_lyrics')).toBe(true);
      expect(evaluateSongAction(albumOwnerId, songWithAlbum, 'manage_audio')).toBe(true);
      expect(evaluateSongAction(albumOwnerId, songWithAlbum, 'comment')).toBe(true);
      expect(evaluateSongAction(albumOwnerId, songWithAlbum, 'resolve_comment')).toBe(true);
      expect(evaluateSongAction(albumOwnerId, songWithAlbum, 'edit_credits')).toBe(true);
      // But only song owner can delete the song
      expect(evaluateSongAction(albumOwnerId, songWithAlbum, 'delete')).toBe(false);
    });

    it('inherits album co-author permissions onto the song', () => {
      expect(evaluateSongAction(albumCoAuthorId, songWithAlbum, 'read')).toBe(true);
      expect(evaluateSongAction(albumCoAuthorId, songWithAlbum, 'edit_lyrics')).toBe(true);
      expect(evaluateSongAction(albumCoAuthorId, songWithAlbum, 'manage_audio')).toBe(true);
      expect(evaluateSongAction(albumCoAuthorId, songWithAlbum, 'comment')).toBe(true);
      expect(evaluateSongAction(albumCoAuthorId, songWithAlbum, 'resolve_comment')).toBe(true);
      expect(evaluateSongAction(albumCoAuthorId, songWithAlbum, 'edit_credits')).toBe(true);
      expect(evaluateSongAction(albumCoAuthorId, songWithAlbum, 'delete')).toBe(false);
    });

    it('inherits album commenter permissions onto the song', () => {
      expect(evaluateSongAction(albumCommenterId, songWithAlbum, 'read')).toBe(true);
      expect(evaluateSongAction(albumCommenterId, songWithAlbum, 'comment')).toBe(true);
      expect(evaluateSongAction(albumCommenterId, songWithAlbum, 'edit_lyrics')).toBe(false);
      expect(evaluateSongAction(albumCommenterId, songWithAlbum, 'manage_audio')).toBe(false);
    });
  });

  describe('Album Permissions', () => {
    const baseAlbum: AlbumContext = {
      id: 'alb_test',
      userId: ownerId,
      collaborators: [
        { userId: coAuthorId, role: 'CO_AUTHOR', status: 'ACTIVE' },
        { userId: commenterId, role: 'COMMENTER', status: 'ACTIVE' },
        { userId: readerId, role: 'READER', status: 'ACTIVE' },
      ],
    };

    it('grants owner all album permissions', () => {
      expect(evaluateAlbumAction(ownerId, baseAlbum, 'read')).toBe(true);
      expect(evaluateAlbumAction(ownerId, baseAlbum, 'edit')).toBe(true);
      expect(evaluateAlbumAction(ownerId, baseAlbum, 'manage_tracks')).toBe(true);
      expect(evaluateAlbumAction(ownerId, baseAlbum, 'manage_collaborators')).toBe(true);
      expect(evaluateAlbumAction(ownerId, baseAlbum, 'delete')).toBe(true);
      expect(evaluateAlbumAction(ownerId, baseAlbum, 'leave')).toBe(false);
    });

    it('grants album co-author edit and tracks management', () => {
      expect(evaluateAlbumAction(coAuthorId, baseAlbum, 'read')).toBe(true);
      expect(evaluateAlbumAction(coAuthorId, baseAlbum, 'edit')).toBe(true);
      expect(evaluateAlbumAction(coAuthorId, baseAlbum, 'manage_tracks')).toBe(true);
      expect(evaluateAlbumAction(coAuthorId, baseAlbum, 'leave')).toBe(true);

      expect(evaluateAlbumAction(coAuthorId, baseAlbum, 'manage_collaborators')).toBe(false);
      expect(evaluateAlbumAction(coAuthorId, baseAlbum, 'delete')).toBe(false);
    });

    it('restricts album commenter and reader', () => {
      expect(evaluateAlbumAction(commenterId, baseAlbum, 'read')).toBe(true);
      expect(evaluateAlbumAction(commenterId, baseAlbum, 'leave')).toBe(true);
      expect(evaluateAlbumAction(commenterId, baseAlbum, 'edit')).toBe(false);

      expect(evaluateAlbumAction(readerId, baseAlbum, 'read')).toBe(true);
      expect(evaluateAlbumAction(readerId, baseAlbum, 'leave')).toBe(true);
      expect(evaluateAlbumAction(readerId, baseAlbum, 'manage_tracks')).toBe(false);
    });
  });

  describe('Comment Permissions', () => {
    const commentAuthorId = 'usr_author_c';
    const testComment: CommentContext = {
      id: 'cmt_1',
      authorId: commentAuthorId,
      songId: 'sng_1',
      song: baseSong,
    };

    it('allows reply if user can comment on song', () => {
      expect(evaluateCommentAction(ownerId, testComment, 'reply')).toBe(true);
      expect(evaluateCommentAction(coAuthorId, testComment, 'reply')).toBe(true);
      expect(evaluateCommentAction(commenterId, testComment, 'reply')).toBe(true);
      expect(evaluateCommentAction(readerId, testComment, 'reply')).toBe(false);
    });

    it('allows resolve and reopen only to owner and co-author', () => {
      expect(evaluateCommentAction(ownerId, testComment, 'resolve')).toBe(true);
      expect(evaluateCommentAction(coAuthorId, testComment, 'resolve')).toBe(true);
      expect(evaluateCommentAction(commenterId, testComment, 'resolve')).toBe(false);
      expect(evaluateCommentAction(readerId, testComment, 'resolve')).toBe(false);
    });

    it('allows delete to comment author or song owner only', () => {
      expect(evaluateCommentAction(commentAuthorId, testComment, 'delete')).toBe(true);
      expect(evaluateCommentAction(ownerId, testComment, 'delete')).toBe(true);
      expect(evaluateCommentAction(coAuthorId, testComment, 'delete')).toBe(false);
      expect(evaluateCommentAction(commenterId, testComment, 'delete')).toBe(false);
    });
  });

  describe('Invitation Permissions', () => {
    const inviterId = 'usr_inviter';
    const invitedId = 'usr_invited';
    const songInvite: InvitationContext = {
      id: 'inv_1',
      inviterId,
      invitedUserId: invitedId,
      songId: 'sng_1',
      song: baseSong,
    };

    it('allows revoke to inviter and resource owner', () => {
      expect(evaluateInvitationAction(inviterId, songInvite, 'revoke')).toBe(true);
      expect(evaluateInvitationAction(ownerId, songInvite, 'revoke')).toBe(true);
      expect(evaluateInvitationAction(strangerId, songInvite, 'revoke')).toBe(false);
    });

    it('allows respond only to invited user', () => {
      expect(evaluateInvitationAction(invitedId, songInvite, 'respond')).toBe(true);
      expect(evaluateInvitationAction(strangerId, songInvite, 'respond')).toBe(false);
    });
  });

  describe('User Actions (Block, Unblock, Report)', () => {
    it('allows action on other user but forbids self-action', () => {
      expect(evaluateUserAction('user_a', 'user_b', 'block')).toBe(true);
      expect(evaluateUserAction('user_a', 'user_b', 'unblock')).toBe(true);
      expect(evaluateUserAction('user_a', 'user_b', 'report')).toBe(true);

      expect(evaluateUserAction('user_a', 'user_a', 'block')).toBe(false);
      expect(evaluateUserAction('user_a', 'user_a', 'unblock')).toBe(false);
      expect(evaluateUserAction('user_a', 'user_a', 'report')).toBe(false);
    });
  });

  describe('assertCan & NotFoundAccessError (Anti-fuite 404)', () => {
    it('does not throw when permission is granted', async () => {
      await expect(
        assertCan({ id: ownerId }, { type: 'song', data: baseSong }, 'read'),
      ).resolves.toBeUndefined();
    });

    it('throws NotFoundAccessError (404) when permission is denied', async () => {
      await expect(
        assertCan({ id: strangerId }, { type: 'song', data: baseSong }, 'read'),
      ).rejects.toThrow(NotFoundAccessError);

      try {
        await assertCan({ id: strangerId }, { type: 'song', data: baseSong }, 'read');
      } catch (err: unknown) {
        expect((err as NotFoundAccessError).statusCode).toBe(404);
        expect((err as NotFoundAccessError).message).toBe('Ressource introuvable');
      }
    });

    it('can() returns false for invalid user', async () => {
      expect(await can({ id: '' }, { type: 'song', data: baseSong }, 'read')).toBe(false);
    });
  });
});
