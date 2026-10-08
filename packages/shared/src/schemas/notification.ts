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

export const notificationPreferencesSchema = z.object({
  emailInvitations: z.boolean().default(true),
  emailComments: z.boolean().default(false),
  emailMentions: z.boolean().default(true),
  emailConflicts: z.boolean().default(true),
  inAppAll: z.boolean().default(true),
});

export const updateNotificationPreferencesSchema = notificationPreferencesSchema.partial();

export const notificationQuerySchema = z.object({
  isRead: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
