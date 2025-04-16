import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Group } from '@/types/Group';
import { GroupMember } from '@/types/GroupMember';
import { MyUser } from '@/types/MyUser';

export enum GroupMemberRole {
  MEMBER = 'member',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

interface GroupService {
  createGroup(name: string, description: string, user: MyUser): Promise<Group>;
  isJoinCodeUnique(joinCode: string): Promise<boolean>;
  generateUniqueJoinCode(): Promise<string>;
  getUserGroups(userId: string): Promise<Group[]>;
  getGroupById(groupId: string): Promise<Group | null>;
  addMemberToGroup(groupId: string, user: MyUser, role?: GroupMemberRole): Promise<void>;
  removeMemberFromGroup(groupId: string, userId: string): Promise<void>;
  updateMemberRole(groupId: string, userId: string, role: GroupMemberRole): Promise<void>;
  clearUserGroupsCache(userId?: string): void;
  getGroupMemberCount(groupId: string): Promise<number>;
  getGroupMemberCounts(groupIds: string[]): Promise<Record<string, number>>;
  updateGroup(groupId: string, updates: Partial<Group>): Promise<void>;
}

class FirestoreGroupService implements GroupService {
  private groupsCollection = collection(db, 'groups');
  private membersCollection = collection(db, 'groupMembers');
  private userGroupsCache: Record<string, { groups: Group[]; timestamp: number }> = {};
  private cacheExpiryTime = 5 * 60 * 1000; // 5 minutes in milliseconds

  async createGroup(name: string, description: string, user: MyUser): Promise<Group> {
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

    // Add creator as admin member
    const memberDocId = `${groupId}_${user.userId}`; // Composite key for uniqueness
    const member: GroupMember = {
      groupId,
      userId: user.userId,
      role: GroupMemberRole.ADMIN,
      joinedAt: Timestamp.now(),
    };

    await setDoc(doc(this.membersCollection, memberDocId), member);

    // Clear the cache for the user who created the group
    this.clearUserGroupsCache(user.userId);

    return group;
  }

  async isJoinCodeUnique(joinCode: string): Promise<boolean> {
    const q = query(this.groupsCollection, where('joinCode', '==', joinCode));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  }

  async generateUniqueJoinCode(): Promise<string> {
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
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    // Check if we have a valid cached result
    const cachedData = this.userGroupsCache[userId];
    const now = Date.now();

    if (cachedData && now - cachedData.timestamp < this.cacheExpiryTime) {
      console.log('Using cached groups for user:', userId);
      return cachedData.groups;
    }

    // Get all group memberships for the user
    const q = query(this.membersCollection, where('userId', '==', userId));
    const memberDocs = await getDocs(q);

    if (memberDocs.empty) {
      // Cache empty result too
      this.userGroupsCache[userId] = { groups: [], timestamp: now };
      return [];
    }

    // Extract all group IDs
    const groupIds = memberDocs.docs.map(doc => doc.data().groupId);

    // Use a single query to get all groups at once
    const groupsQuery = query(this.groupsCollection, where('groupId', 'in', groupIds));
    const groupDocs = await getDocs(groupsQuery);

    // Map the results to Group objects
    const groups = groupDocs.docs.map(doc => doc.data() as Group);

    // Cache the result
    this.userGroupsCache[userId] = { groups, timestamp: now };

    return groups;
  }

  async getGroupById(groupId: string): Promise<Group | null> {
    const groupDoc = await getDoc(doc(this.groupsCollection, groupId));
    return groupDoc.exists() ? (groupDoc.data() as Group) : null;
  }

  async addMemberToGroup(
    groupId: string,
    user: MyUser,
    role: GroupMemberRole = GroupMemberRole.MEMBER
  ): Promise<void> {
    const memberDocId = `${groupId}_${user.userId}`; // Composite key for uniqueness
    const member: GroupMember = {
      groupId,
      userId: user.userId,
      role,
      joinedAt: Timestamp.now(),
    };

    await setDoc(doc(this.membersCollection, memberDocId), member);
  }

  async removeMemberFromGroup(groupId: string, userId: string): Promise<void> {
    const memberDocId = `${groupId}_${userId}`;
    await deleteDoc(doc(this.membersCollection, memberDocId));
  }

  async updateMemberRole(groupId: string, userId: string, role: GroupMemberRole): Promise<void> {
    const memberDocId = `${groupId}_${userId}`;
    await updateDoc(doc(this.membersCollection, memberDocId), { role });
  }

  // Add a method to clear the cache when needed (e.g., after creating a new group)
  clearUserGroupsCache(userId?: string): void {
    if (userId) {
      delete this.userGroupsCache[userId];
    } else {
      this.userGroupsCache = {};
    }
  }

  async getGroupMemberCount(groupId: string): Promise<number> {
    const q = query(this.membersCollection, where('groupId', '==', groupId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  }

  async getGroupMemberCounts(groupIds: string[]): Promise<Record<string, number>> {
    if (groupIds.length === 0) return {};

    // If there's only one group, use the single group method
    if (groupIds.length === 1) {
      const count = await this.getGroupMemberCount(groupIds[0]);
      return { [groupIds[0]]: count };
    }

    // For multiple groups, we need to use a more efficient approach
    // We'll use a single query with 'in' operator to get all members for the groups
    const q = query(this.membersCollection, where('groupId', 'in', groupIds));
    const querySnapshot = await getDocs(q);

    // Count members for each group
    const counts: Record<string, number> = {};
    groupIds.forEach(id => {
      counts[id] = 0; // Initialize all groups with 0
    });

    // Count members for each group
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const groupId = data.groupId;
      counts[groupId] = (counts[groupId] || 0) + 1;
    });

    return counts;
  }

  async updateGroup(groupId: string, updates: Partial<Group>): Promise<void> {
    const groupRef = doc(this.groupsCollection, groupId);

    // Add updatedAt timestamp
    const updatedData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(groupRef, updatedData);

    // Clear cache for all users who might have this group
    this.clearUserGroupsCache();
  }
}

export const groupService: GroupService = new FirestoreGroupService();
