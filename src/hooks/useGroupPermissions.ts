import { GroupMemberRole } from '@/services/groupService';
import { Group } from '@/types/Group';

export const useGroupPermissions = () => {
  const hasPermission = (group: Group, permission: GroupPermission): boolean => {
    if (!group.userRole) return false;

    switch (permission) {
      case GroupPermission.EDIT_GROUP:
        return [GroupMemberRole.ADMIN, GroupMemberRole.MODERATOR].includes(group.userRole);
      case GroupPermission.MANAGE_MEMBERS:
        return [GroupMemberRole.ADMIN, GroupMemberRole.MODERATOR].includes(group.userRole);
      case GroupPermission.VIEW_MEMBERS:
        return true; // All members can view
      default:
        return false;
    }
  };

  const getRoleColor = (role?: GroupMemberRole): 'primary' | 'secondary' | 'default' => {
    switch (role) {
      case GroupMemberRole.ADMIN:
        return 'primary';
      case GroupMemberRole.MODERATOR:
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role?: GroupMemberRole): string => {
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

  return {
    hasPermission,
    getRoleColor,
    getRoleLabel,
  };
};

export enum GroupPermission {
  EDIT_GROUP = 'EDIT_GROUP',
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
  VIEW_MEMBERS = 'VIEW_MEMBERS',
}
