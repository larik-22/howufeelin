import { useState } from 'react';
import { Group } from '@/types/Group';
import { GroupMemberRole } from '@/types/GroupMemberRole';

interface UseLeaveGroupResult {
  leaveGroupModalOpen: boolean;
  leaveGroupLoading: boolean;
  handleLeaveGroupClick: (group: Group) => void;
  handleCloseLeaveGroupModal: () => void;
  handleLeaveGroup: () => Promise<void>;
  selectedGroup: Group | null;
}

export function useLeaveGroup(
  userId: string | undefined,
  onSuccess: () => void,
  onError: (message: string) => void
): UseLeaveGroupResult {
  const [leaveGroupModalOpen, setLeaveGroupModalOpen] = useState<boolean>(false);
  const [leaveGroupLoading, setLeaveGroupLoading] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Show the leave group confirmation modal
  const handleLeaveGroupClick = (group: Group) => {
    // Only allow non-admin users to leave
    if (group.userRole === GroupMemberRole.ADMIN) {
      onError('Group admins cannot leave their own group');
      return;
    }

    setSelectedGroup(group);
    setLeaveGroupModalOpen(true);
  };

  // Close the leave group confirmation modal
  const handleCloseLeaveGroupModal = () => {
    setLeaveGroupModalOpen(false);
    setSelectedGroup(null);
  };

  // Handle the actual leaving process
  const handleLeaveGroup = async () => {
    if (!selectedGroup?.groupId || !userId) return;

    try {
      setLeaveGroupLoading(true);

      // The actual leave operation will be handled by the LeaveGroupDialog component
      // This is just a placeholder for the hook's API

      // Close the modal
      setLeaveGroupModalOpen(false);

      // Call the success callback
      onSuccess();
    } catch (error) {
      console.error('Error leaving group:', error);
      onError('Failed to leave the group');
    } finally {
      setLeaveGroupLoading(false);
      setSelectedGroup(null);
    }
  };

  return {
    leaveGroupModalOpen,
    leaveGroupLoading,
    handleLeaveGroupClick,
    handleCloseLeaveGroupModal,
    handleLeaveGroup,
    selectedGroup,
  };
}
