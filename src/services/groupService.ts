import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  updateDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Group } from '@/types/Group';
import { GroupMember } from '@/types/GroupMember';
import { MyUser } from '@/types/MyUser';
import { ratingService } from '@/services/ratingService';
import { GroupMemberRole } from '@/types/GroupMemberRole';

interface GroupService {
  createGroup(name: string, description: string, user: MyUser): Promise<Group>;
  isJoinCodeUnique(joinCode: string): Promise<boolean>;
  generateUniqueJoinCode(): Promise<string>;
  getUserGroups(userId: string): Promise<Group[]>;
  getGroupById(groupId: string, userId?: string): Promise<Group | null>;
  addMemberToGroup(groupId: string, user: MyUser, role?: GroupMemberRole): Promise<void>;
  removeMemberFromGroup(groupId: string, userId: string): Promise<void>;
  updateMemberRole(groupId: string, userId: string, role: GroupMemberRole): Promise<void>;
  getGroupMemberCount(groupId: string): Promise<number>;
  getGroupMemberCounts(groupIds: string[]): Promise<Record<string, number>>;
  getGroupMembers(groupId: string): Promise<GroupMember[]>;
  updateGroup(groupId: string, updates: Partial<Group>): Promise<void>;
  joinGroup(joinCode: string, user: MyUser): Promise<Group>;
  deleteGroup(groupId: string, userId?: string): Promise<void>;
  getGroupDetailData(
    groupId: string,
    userId: string
  ): Promise<{
    group: Group;
    memberCount: number;
    members: GroupMember[];
    userRole: GroupMemberRole;
  }>;
  subscribeToGroup(groupId: string, callback: (group: Group | null) => void): Unsubscribe;
  subscribeToGroupMembers(groupId: string, callback: (members: GroupMember[]) => void): Unsubscribe;
  subscribeToGroupMemberCounts(
    groupIds: string[],
    callback: (counts: Record<string, number>) => void
  ): Unsubscribe;
  subscribeToUserGroups(userId: string, callback: (groups: Group[]) => void): Unsubscribe;
  isSubscriptionActive(type: string, id: string): boolean;
  unsubscribeAll(): void;
  createRating(groupId: string, userId: string, rating: number, note?: string): Promise<void>;
}

class FirestoreGroupService implements GroupService {
  private groupsCollection = collection(db, 'groups');
  private membersCollection = collection(db, 'groupMembers');
  private activeSubscriptions: Record<string, Unsubscribe> = {};

  private generateSubscriptionId(type: string, id: string): string {
    return `${type}_${id}`;
  }

  private unsubscribe(subscriptionId: string): void {
    if (this.activeSubscriptions[subscriptionId]) {
      console.log(`Unsubscribing from ${subscriptionId}`);
      this.activeSubscriptions[subscriptionId]();
      delete this.activeSubscriptions[subscriptionId];
    }
  }

  public unsubscribeAll(): void {
    const count = Object.keys(this.activeSubscriptions).length;
    if (count > 0) {
      console.log(`Unsubscribing from ${count} active subscriptions`);
      Object.keys(this.activeSubscriptions).forEach(id => {
        this.unsubscribe(id);
      });
    }
  }

  public isSubscriptionActive(type: string, id: string): boolean {
    const subscriptionId = this.generateSubscriptionId(type, id);
    return !!this.activeSubscriptions[subscriptionId];
  }

  async createGroup(name: string, description: string, user: MyUser): Promise<Group> {
    try {
      const joinCode = await this.generateUniqueJoinCode();
      const groupRef = doc(this.groupsCollection);
      const groupId = groupRef.id;

      const group: Group = {
        groupId,
        groupName: name,
        groupDescription: description,
        createdBy: user.userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        joinCode,
      };

      await setDoc(groupRef, group);

      const memberDocId = `${groupId}_${user.userId}`;
      const member: GroupMember = {
        groupId,
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        role: GroupMemberRole.ADMIN,
        joinedAt: Timestamp.now(),
        photoURL: user.photoURL || undefined,
      };

      await setDoc(doc(this.membersCollection, memberDocId), member);

      return {
        ...group,
        userRole: GroupMemberRole.ADMIN,
      };
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async isJoinCodeUnique(joinCode: string): Promise<boolean> {
    try {
      const q = query(this.groupsCollection, where('joinCode', '==', joinCode));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error('Error checking join code uniqueness:', error);
      throw error;
    }
  }

  async generateUniqueJoinCode(): Promise<string> {
    try {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let joinCode: string;
      let isUnique = false;

      while (!isUnique) {
        joinCode = Array.from({ length: 6 }, () =>
          characters.charAt(Math.floor(Math.random() * characters.length))
        ).join('');

        isUnique = await this.isJoinCodeUnique(joinCode);
        if (isUnique) {
          return joinCode;
        }
      }

      throw new Error('Failed to generate unique join code');
    } catch (error) {
      console.error('Error generating unique join code:', error);
      throw error;
    }
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    try {
      // Get all group memberships for the user
      const q = query(this.membersCollection, where('userId', '==', userId));
      const memberDocs = await getDocs(q);

      if (memberDocs.empty) {
        return [];
      }

      // Create a map of groupId to role
      const roleMap = new Map<string, GroupMemberRole>();
      memberDocs.docs.forEach(doc => {
        const data = doc.data() as GroupMember;
        roleMap.set(data.groupId, data.role);
      });

      // Extract all group IDs
      const groupIds = memberDocs.docs.map(doc => doc.data().groupId);

      // If there are no groups, return empty array
      if (groupIds.length === 0) {
        return [];
      }

      // Use a single query to get all groups at once
      const groupsQuery = query(this.groupsCollection, where('groupId', 'in', groupIds));
      const groupDocs = await getDocs(groupsQuery);

      // Map the results to Group objects and add role information
      const groups = groupDocs.docs.map(doc => {
        const groupData = doc.data() as Group;
        return {
          ...groupData,
          userRole: roleMap.get(groupData.groupId) || GroupMemberRole.MEMBER,
        };
      });

      return groups;
    } catch (error) {
      console.error('Error getting user groups:', error);
      // Return empty array on error to prevent app crashes
      return [];
    }
  }

  async getGroupById(groupId: string, userId?: string): Promise<Group | null> {
    try {
      const groupDoc = await getDoc(doc(this.groupsCollection, groupId));

      if (!groupDoc.exists()) {
        return null;
      }

      const group = groupDoc.data() as Group;

      if (userId) {
        try {
          const memberDocId = `${groupId}_${userId}`;
          const memberRef = doc(db, 'groupMembers', memberDocId);
          const memberDoc = await getDoc(memberRef);

          if (memberDoc.exists()) {
            const memberData = memberDoc.data() as GroupMember;
            return {
              ...group,
              userRole: memberData.role,
            };
          }
        } catch (error) {
          console.error('Error getting user role for group:', error);
        }
      }

      return group;
    } catch (error) {
      console.error('Error getting group by ID:', error);
      return null;
    }
  }

  async addMemberToGroup(
    groupId: string,
    user: MyUser,
    role: GroupMemberRole = GroupMemberRole.MEMBER
  ): Promise<void> {
    try {
      // Check if the group exists first
      const groupDoc = await getDoc(doc(this.groupsCollection, groupId));
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      // Check if the user is already a member
      const memberDocId = `${groupId}_${user.userId}`;
      const memberDoc = await getDoc(doc(this.membersCollection, memberDocId));
      if (memberDoc.exists()) {
        throw new Error('User is already a member of this group');
      }

      // Create the member document
      const member: GroupMember = {
        groupId,
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        role,
        joinedAt: Timestamp.now(),
        photoURL: user.photoURL || undefined,
      };

      // Use a batch to ensure atomicity
      const batch = writeBatch(db);
      batch.set(doc(this.membersCollection, memberDocId), member);
      await batch.commit();
    } catch (error) {
      console.error('Error adding member to group:', error);
      throw error;
    }
  }

  async removeMemberFromGroup(groupId: string, userId: string): Promise<void> {
    try {
      // Check if the user is a member of the group
      const memberDocId = `${groupId}_${userId}`;
      const memberDoc = await getDoc(doc(this.membersCollection, memberDocId));
      if (!memberDoc.exists()) {
        throw new Error('User is not a member of this group');
      }

      // Use a batch to ensure atomicity
      const batch = writeBatch(db);
      batch.delete(doc(this.membersCollection, memberDocId));
      await batch.commit();
    } catch (error) {
      console.error('Error removing member from group:', error);
      throw error;
    }
  }

  async updateMemberRole(groupId: string, userId: string, role: GroupMemberRole): Promise<void> {
    try {
      // Check if the user is a member of the group
      const memberDocId = `${groupId}_${userId}`;
      const memberDoc = await getDoc(doc(this.membersCollection, memberDocId));
      if (!memberDoc.exists()) {
        throw new Error('User is not a member of this group');
      }

      const memberData = memberDoc.data() as GroupMember;

      // Prevent changing admin's role
      if (memberData.role === GroupMemberRole.ADMIN) {
        throw new Error('Cannot change admin role');
      }

      // Use a batch to ensure atomicity
      const batch = writeBatch(db);
      batch.update(doc(this.membersCollection, memberDocId), {
        role,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  private async checkBannedStatus(groupId: string, userId: string): Promise<boolean> {
    try {
      const memberDocId = `${groupId}_${userId}`;
      const memberDoc = await getDoc(doc(this.membersCollection, memberDocId));

      if (memberDoc.exists()) {
        const memberData = memberDoc.data() as GroupMember;
        return memberData.role === GroupMemberRole.BANNED;
      }

      return false;
    } catch (error) {
      console.error('Error checking banned status:', error);
      return false;
    }
  }

  async getGroupMemberCount(groupId: string): Promise<number> {
    try {
      const q = query(this.membersCollection, where('groupId', '==', groupId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting group member count:', error);
      return 0;
    }
  }

  async getGroupMemberCounts(groupIds: string[]): Promise<Record<string, number>> {
    try {
      if (groupIds.length === 0) return {};

      if (groupIds.length === 1) {
        const count = await this.getGroupMemberCount(groupIds[0]);
        return { [groupIds[0]]: count };
      }

      // Initialize counts object with zeros for all group IDs
      const counts: Record<string, number> = {};
      groupIds.forEach(id => {
        counts[id] = 0;
      });

      // Query for members in all groups at once
      const q = query(this.membersCollection, where('groupId', 'in', groupIds));
      const querySnapshot = await getDocs(q);

      // Count members for each group
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const groupId = data.groupId;
        if (groupId && groupId in counts) {
          counts[groupId] = (counts[groupId] || 0) + 1;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error getting group member counts:', error);
      return {};
    }
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const q = query(this.membersCollection, where('groupId', '==', groupId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => doc.data() as GroupMember);
    } catch (error) {
      console.error('Error getting group members:', error);
      return [];
    }
  }

  async updateGroup(groupId: string, updates: Partial<Group>): Promise<void> {
    try {
      const groupRef = doc(this.groupsCollection, groupId);

      // Add updatedAt timestamp
      const updatedData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(groupRef, updatedData);
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  async joinGroup(joinCode: string, user: MyUser): Promise<Group> {
    try {
      // First, find the group by join code
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('joinCode', '==', joinCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Group not found');
      }

      const groupDoc = querySnapshot.docs[0];
      const groupId = groupDoc.id;
      const groupData = groupDoc.data() as Group;

      // Check if user is trying to join their own group
      if (groupData.createdBy === user.userId) {
        throw new Error('You cannot join your own group');
      }

      // Check if user is already a member using the members collection
      const memberDocId = `${groupId}_${user.userId}`;
      const memberDoc = await getDoc(doc(this.membersCollection, memberDocId));

      if (memberDoc.exists()) {
        const memberData = memberDoc.data() as GroupMember;
        if (memberData.role === GroupMemberRole.BANNED) {
          throw new Error('You are banned from this group');
        }
        throw new Error('Already a member of this group');
      }

      // Add user to group members with a single write operation
      const member: GroupMember = {
        groupId,
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
        photoURL: user.photoURL || undefined,
      };

      await setDoc(doc(this.membersCollection, memberDocId), member);

      // Return the group with the user role
      return {
        ...groupData,
        userRole: GroupMemberRole.MEMBER,
      };
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  }

  async deleteGroup(groupId: string, userId?: string): Promise<void> {
    try {
      console.log('Deleting group:', groupId);

      // If userId is provided, verify the user has permission to delete the group
      if (userId) {
        // Get the group to check if the user is the creator
        const groupDoc = await getDoc(doc(this.groupsCollection, groupId));

        if (!groupDoc.exists()) {
          throw new Error('Group not found');
        }

        const groupData = groupDoc.data() as Group;

        // Check if the user is the creator of the group
        if (groupData.createdBy !== userId) {
          // Check if the user is an admin of the group
          const memberDocId = `${groupId}_${userId}`;
          const memberDoc = await getDoc(doc(this.membersCollection, memberDocId));

          if (!memberDoc.exists() || memberDoc.data().role !== GroupMemberRole.ADMIN) {
            throw new Error('You do not have permission to delete this group');
          }
        }
      }

      // First, delete all members to ensure proper cleanup
      const memberQuery = query(this.membersCollection, where('groupId', '==', groupId));
      const memberSnapshot = await getDocs(memberQuery);

      // Use a batch to delete the group and all its members in a single transaction
      const batch = writeBatch(db);

      // Delete all members first
      memberSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete the group document
      batch.delete(doc(this.groupsCollection, groupId));

      // Commit the batch
      await batch.commit();
      console.log('Group and members deleted successfully');

      // Delete all ratings associated with this group
      // This is done separately since it's in a different collection
      await ratingService.deleteAllRatingsForGroup(groupId);
      console.log('Ratings deleted successfully');

      // Clean up all subscriptions for this group
      const subscriptionsToClean = [
        this.generateSubscriptionId('group', groupId),
        this.generateSubscriptionId('members', groupId),
        this.generateSubscriptionId('memberCounts', groupId),
        this.generateSubscriptionId('userGroups', userId || ''),
        this.generateSubscriptionId('groupMembers', groupId),
      ];

      // Unsubscribe from all related subscriptions
      subscriptionsToClean.forEach(subId => {
        this.unsubscribe(subId);
      });

      // Force a refresh of user groups subscription if userId is provided
      if (userId) {
        const userGroupsSubId = this.generateSubscriptionId('userGroups', userId);
        if (this.activeSubscriptions[userGroupsSubId]) {
          this.unsubscribe(userGroupsSubId);
          // The subscription will be automatically recreated by the component
        }
      }

      console.log('Subscriptions cleaned up');
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  async getGroupDetailData(
    groupId: string,
    userId: string
  ): Promise<{
    group: Group;
    memberCount: number;
    members: GroupMember[];
    userRole: GroupMemberRole;
  }> {
    try {
      // Get group document
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const group = groupDoc.data() as Group;

      // Get user's role in this group from groupMembers collection
      const memberDocId = `${groupId}_${userId}`;
      const memberRef = doc(db, 'groupMembers', memberDocId);
      const memberDoc = await getDoc(memberRef);

      if (!memberDoc.exists()) {
        throw new Error('User is not a member of this group');
      }

      const memberData = memberDoc.data() as GroupMember;
      const userRole = memberData.role;

      // Get member count and members in parallel
      const [memberCount, members] = await Promise.all([
        this.getGroupMemberCount(groupId),
        this.getGroupMembers(groupId),
      ]);

      return {
        group,
        memberCount,
        members,
        userRole,
      };
    } catch (error) {
      console.error('Error getting group detail data:', error);
      throw error;
    }
  }

  subscribeToGroup(groupId: string, callback: (group: Group | null) => void): Unsubscribe {
    const subscriptionId = this.generateSubscriptionId('group', groupId);

    // Unsubscribe from any existing subscription with the same ID
    this.unsubscribe(subscriptionId);

    // Create a new subscription
    const unsubscribe = onSnapshot(
      doc(this.groupsCollection, groupId),
      doc => {
        if (doc.exists()) {
          const group = doc.data() as Group;
          callback({ ...group, groupId: doc.id });
        } else {
          callback(null);
        }
      },
      error => {
        console.error('Error subscribing to group:', error);
        callback(null);
      }
    );

    // Store the subscription
    this.activeSubscriptions[subscriptionId] = unsubscribe;

    return unsubscribe;
  }

  subscribeToGroupMembers(
    groupId: string,
    callback: (members: GroupMember[]) => void
  ): Unsubscribe {
    const subscriptionId = this.generateSubscriptionId('members', groupId);

    // Unsubscribe from any existing subscription with the same ID
    this.unsubscribe(subscriptionId);

    // Create a new subscription
    const unsubscribe = onSnapshot(
      query(this.membersCollection, where('groupId', '==', groupId)),
      querySnapshot => {
        const members = querySnapshot.docs.map(doc => doc.data() as GroupMember);
        callback(members);
      },
      error => {
        console.error('Error subscribing to group members:', error);
        callback([]);
      }
    );

    // Store the subscription
    this.activeSubscriptions[subscriptionId] = unsubscribe;

    return unsubscribe;
  }

  /**
   * Subscribe to member counts for multiple groups at once
   * This is more efficient than creating individual subscriptions for each group
   * @param groupIds Array of group IDs to subscribe to
   * @param callback Function to call when member counts change
   * @returns Unsubscribe function
   */
  subscribeToGroupMemberCounts(
    groupIds: string[],
    callback: (counts: Record<string, number>) => void
  ): Unsubscribe {
    if (groupIds.length === 0) {
      callback({});
      return () => {};
    }

    const subscriptionId = this.generateSubscriptionId('memberCounts', groupIds.join('_'));

    // Unsubscribe from any existing subscription with the same ID
    this.unsubscribe(subscriptionId);

    // Initialize counts object with zeros for all group IDs
    const counts: Record<string, number> = {};
    groupIds.forEach(id => {
      counts[id] = 0;
    });

    // Create a new subscription for all groups at once
    const unsubscribe = onSnapshot(
      query(this.membersCollection, where('groupId', 'in', groupIds)),
      querySnapshot => {
        // Reset counts
        groupIds.forEach(id => {
          counts[id] = 0;
        });

        // Count members for each group
        querySnapshot.forEach(doc => {
          const data = doc.data();
          const groupId = data.groupId;
          if (groupId && groupId in counts) {
            counts[groupId] = (counts[groupId] || 0) + 1;
          }
        });

        callback({ ...counts });
      },
      error => {
        console.error('Error subscribing to group member counts:', error);
        callback({});
      }
    );

    // Store the subscription
    this.activeSubscriptions[subscriptionId] = unsubscribe;

    return unsubscribe;
  }

  subscribeToUserGroups(userId: string, callback: (groups: Group[]) => void): Unsubscribe {
    const subscriptionId = this.generateSubscriptionId('userGroups', userId);

    // Unsubscribe from any existing subscription with the same ID
    this.unsubscribe(subscriptionId);

    // Create a map to store group subscriptions
    const groupSubscriptions: Record<string, Unsubscribe> = {};
    let currentGroups: Group[] = [];

    // First, get all group IDs the user is a member of
    const memberQuery = query(this.membersCollection, where('userId', '==', userId));

    // Create a new subscription for user's group memberships
    const unsubscribe = onSnapshot(
      memberQuery,
      async memberSnapshot => {
        console.log('Member snapshot updated:', memberSnapshot.size, 'memberships');

        // Get current group IDs from the member snapshot
        const currentGroupIds = memberSnapshot.docs.map(doc => doc.data().groupId);
        console.log('Current group IDs:', currentGroupIds);

        // Create a map of groupId to role
        const roleMap = new Map<string, GroupMemberRole>();
        memberSnapshot.docs.forEach(doc => {
          const data = doc.data() as GroupMember;
          roleMap.set(data.groupId, data.role);
        });

        if (memberSnapshot.empty) {
          // Clean up any existing group subscriptions
          Object.values(groupSubscriptions).forEach(unsub => unsub());
          Object.keys(groupSubscriptions).forEach(key => delete groupSubscriptions[key]);
          currentGroups = [];
          callback([]);
          return;
        }

        // Extract all group IDs
        const groupIds = memberSnapshot.docs.map(doc => doc.data().groupId);
        console.log('User is a member of groups:', groupIds);

        // Clean up subscriptions for groups the user is no longer a member of
        Object.keys(groupSubscriptions).forEach(groupId => {
          if (!groupIds.includes(groupId)) {
            console.log('Unsubscribing from group that user is no longer a member of:', groupId);
            groupSubscriptions[groupId]();
            delete groupSubscriptions[groupId];
            // Remove the group from currentGroups
            currentGroups = currentGroups.filter(g => g.groupId !== groupId);
          }
        });

        // If there are no groups, return empty array
        if (groupIds.length === 0) {
          currentGroups = [];
          callback([]);
          return;
        }

        // Set up individual subscriptions for each group
        const updateCallback = () => {
          // Sort groups to maintain consistent order
          const sortedGroups = [...currentGroups].sort((a, b) =>
            a.groupName.localeCompare(b.groupName)
          );
          console.log('Updating groups list with:', sortedGroups.length, 'groups');
          callback(sortedGroups);
        };

        // Set up subscriptions for each group
        groupIds.forEach(groupId => {
          // Skip if we already have a subscription for this group
          if (groupSubscriptions[groupId]) return;

          console.log('Setting up subscription for group:', groupId);

          // Create a subscription for this group
          const groupUnsubscribe = onSnapshot(
            doc(this.groupsCollection, groupId),
            doc => {
              if (doc.exists()) {
                const groupData = doc.data() as Group;
                const group: Group = {
                  ...groupData,
                  groupId: doc.id,
                  userRole: roleMap.get(doc.id) || GroupMemberRole.MEMBER,
                };

                console.log('Group updated:', group.groupName);

                // Update or add the group in our array
                const index = currentGroups.findIndex(g => g.groupId === doc.id);
                if (index >= 0) {
                  currentGroups[index] = group;
                } else {
                  currentGroups.push(group);
                }

                // Notify the callback with the updated groups
                updateCallback();
              } else {
                // Group was deleted, remove it from our array
                console.log('Group deleted:', groupId);
                currentGroups = currentGroups.filter(g => g.groupId !== groupId);
                updateCallback();

                // Clean up the subscription
                groupSubscriptions[groupId]();
                delete groupSubscriptions[groupId];
              }
            },
            error => {
              console.error(`Error subscribing to group ${groupId}:`, error);
            }
          );

          // Store the subscription
          groupSubscriptions[groupId] = groupUnsubscribe;
        });

        // Initial update of the callback with current groups
        updateCallback();
      },
      error => {
        console.error('Error subscribing to user groups:', error);
        callback([]);
      }
    );

    // Store the main subscription
    this.activeSubscriptions[subscriptionId] = unsubscribe;

    // Return a function that cleans up all subscriptions
    return () => {
      unsubscribe();
      Object.values(groupSubscriptions).forEach(unsub => unsub());
    };
  }

  /*eslint-disable */
  async createRating(
    groupId: string,
    userId: string,
    rating: number,
    note?: string
  ): Promise<void> {
    try {
      // Check if user is banned
      const isBanned = await this.checkBannedStatus(groupId, userId);
      if (isBanned) {
        throw new Error('You cannot rate in this group as you are banned');
      }

      // Continue with rating creation...
      // ... existing rating creation code ...
    } catch (error) {
      console.error('Error creating rating:', error);
      throw error;
    }
  }
}

export const groupService: GroupService = new FirestoreGroupService();
