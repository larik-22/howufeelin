/**
 * Enum representing the possible roles a user can have in a group.
 * This serves as a single source of truth for role values across the application.
 */
export enum GroupMemberRole {
  MEMBER = 'member',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  BANNED = 'banned',
}
