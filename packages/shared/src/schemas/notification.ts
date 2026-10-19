import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'INVITATION_RECEIVED',
  'INVITATION_ACCEPTED',
  'INVITATION_DECLINED',
  'COMMENT_ADDED',
  'COMMENT_REPLY',
  'MENTION',
  'CONFLICT_DETECTED',
]);

export const notificationSettingsSchema = z.object({
  inApp: z
    .object({
      invitations: z.boolean().default(true),
      comments: z.boolean().default(true),
      mentions: z.boolean().default(true),
    })
    .default({
      invitations: true,
      comments: true,
      mentions: true,
    }),
  email: z
    .object({
      invitations: z.boolean().default(true),
      comments: z.boolean().default(false),
      mentions: z.boolean().default(true),
    })
    .default({
      invitations: true,
      comments: false,
      mentions: true,
    }),
});

export const updateNotificationSettingsSchema = z.object({
  inApp: z
    .object({
      invitations: z.boolean().optional(),
      comments: z.boolean().optional(),
      mentions: z.boolean().optional(),
    })
    .optional(),
  email: z
    .object({
      invitations: z.boolean().optional(),
      comments: z.boolean().optional(),
      mentions: z.boolean().optional(),
    })
    .optional(),
});

export const notificationPreferencesSchema = z.object({
  emailInvitations: z.boolean().default(true),
  emailComments: z.boolean().default(false),
  emailMentions: z.boolean().default(true),
  emailConflicts: z.boolean().default(true),
  inAppAll: z.boolean().default(true),
});

export const updateNotificationPreferencesSchema = notificationPreferencesSchema.partial();

export const notificationQuerySchema = z.object({
  unreadOnly: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
  isRead: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;

import type { NotificationItem } from '../types/collaboration.js';

export interface NotificationListResponse {
  unreadCount: number;
  notifications: NotificationItem[];
}
