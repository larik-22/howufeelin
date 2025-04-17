import { GroupMemberRole } from '@/services/groupService';

export const getRoleColor = (role: GroupMemberRole): 'primary' | 'secondary' | 'default' => {
  switch (role) {
    case GroupMemberRole.ADMIN:
      return 'primary';
    case GroupMemberRole.MODERATOR:
      return 'secondary';
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
    default:
      return 'Unknown';
  }
};

export const getRoleChipColor = (role: GroupMemberRole): 'primary' | 'secondary' | 'default' => {
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

  // Admins can manage all members
  if (currentUserRole === GroupMemberRole.ADMIN) {
    return true;
  }

  // Moderators can manage regular members
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

  // Admins and moderators can remove regular members
  return (
    (currentUserRole === GroupMemberRole.ADMIN || currentUserRole === GroupMemberRole.MODERATOR) &&
    targetMemberRole === GroupMemberRole.MEMBER
  );
};
