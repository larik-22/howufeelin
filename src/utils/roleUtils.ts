import { GroupMemberRole } from '@/types/GroupMemberRole';

export const getRoleColor = (
  role: GroupMemberRole
): 'primary' | 'secondary' | 'default' | 'error' => {
  switch (role) {
    case GroupMemberRole.ADMIN:
      return 'primary';
    case GroupMemberRole.MODERATOR:
      return 'secondary';
    case GroupMemberRole.BANNED:
      return 'error';
    default:
      return 'default';
  }
};

export const getRoleLabel = (role: GroupMemberRole): string => {
  switch (role) {
    case GroupMemberRole.ADMIN:
      return 'Admin';
    case GroupMemberRole.MODERATOR:
      return 'Moderator';
    case GroupMemberRole.MEMBER:
      return 'Member';
    case GroupMemberRole.BANNED:
      return 'Banned';
    default:
      return 'Unknown';
  }
};

export const getRoleChipColor = (
  role: GroupMemberRole
): 'primary' | 'secondary' | 'default' | 'error' => {
  return getRoleColor(role);
};

export const canManageMember = (
  currentUserRole: GroupMemberRole,
  targetMemberRole: GroupMemberRole,
  isCurrentUser: boolean,
  isTargetUserAdmin: boolean
): boolean => {
  // Can't manage the admin (group creator)
  if (isTargetUserAdmin) {
    return false;
  }

  // Can't manage yourself
  if (isCurrentUser) {
    return false;
  }

  // Admins can manage all members (including banned)
  if (currentUserRole === GroupMemberRole.ADMIN) {
    return true;
  }

  // Moderators can manage regular members only (not banned)
  if (currentUserRole === GroupMemberRole.MODERATOR) {
    return targetMemberRole === GroupMemberRole.MEMBER;
  }

  return false;
};

export const canRemoveMember = (
  currentUserRole: GroupMemberRole,
  targetMemberRole: GroupMemberRole,
  isCurrentUser: boolean,
  isTargetUserAdmin: boolean
): boolean => {
  // Can't remove yourself
  if (isCurrentUser) {
    return false;
  }

  // Can't remove the admin (group creator)
  if (isTargetUserAdmin) {
    return false;
  }

  // Admins can remove any member (including banned)
  if (currentUserRole === GroupMemberRole.ADMIN) {
    return true;
  }

  // Moderators can only remove regular members
  if (currentUserRole === GroupMemberRole.MODERATOR) {
    return targetMemberRole === GroupMemberRole.MEMBER;
  }

  return false;
};

export const canBanMember = (
  currentUserRole: GroupMemberRole,
  // @ts-expect-error - targetMemberRole is intentionally unused for now
  targetMemberRole: GroupMemberRole,
  isCurrentUser: boolean,
  isTargetUserAdmin: boolean
): boolean => {
  // Can't ban yourself
  if (isCurrentUser) {
    return false;
  }

  // Can't ban the admin (group creator)
  if (isTargetUserAdmin) {
    return false;
  }

  // Only admins can ban/unban members
  if (currentUserRole === GroupMemberRole.ADMIN) {
    return true;
  }

  return false;
};
