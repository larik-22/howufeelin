import { Timestamp } from 'firebase/firestore';
import { MyUser } from '../../src/types/MyUser';
import { Group } from '../../src/types/Group';
import { GroupMember } from '../../src/types/GroupMember';
import { GroupMemberRole } from '../../src/types/GroupMemberRole';
import { Rating } from '../../src/types/Rating';

/**
 * Creates a valid user document for testing
 * @param userId - The user ID
 * @param overrides - Optional overrides for the default values
 * @returns A valid user document
 */
export const createValidUser = (userId: string, overrides: Partial<MyUser> = {}): MyUser => {
  const now = Timestamp.now();

  return {
    userId,
    username: `user_${userId}`,
    email: `user_${userId}@example.com`,
    displayName: `User ${userId}`,
    photoURL: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

/**
 * Creates a valid group document for testing
 * @param groupId - The group ID
 * @param createdBy - The user ID of the creator
 * @param overrides - Optional overrides for the default values
 * @returns A valid group document
 */
export const createValidGroup = (
  groupId: string,
  createdBy: string,
  overrides: Partial<Group> = {}
): Group => {
  const now = Timestamp.now();

  return {
    groupId,
    groupName: `Group ${groupId}`,
    groupDescription: `Description for group ${groupId}`,
    createdBy,
    createdAt: now,
    updatedAt: now,
    joinCode: 'ABC123',
    ...overrides,
  };
};

/**
 * Creates a valid group member document for testing
 * @param groupId - The group ID
 * @param userId - The user ID
 * @param role - The role of the user in the group
 * @param overrides - Optional overrides for the default values
 * @returns A valid group member document
 */
export const createValidGroupMember = (
  groupId: string,
  userId: string,
  role: GroupMemberRole = GroupMemberRole.MEMBER,
  overrides: Partial<GroupMember> = {}
): GroupMember => {
  const now = Timestamp.now();

  return {
    groupId,
    userId,
    email: `user_${userId}@example.com`,
    displayName: `User ${userId}`,
    role,
    joinedAt: now,
    photoURL: null,
    ...overrides,
  };
};

/**
 * Creates a timestamp for a specific date
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns A Firestore timestamp for the specified date
 */
export const createTimestampForDate = (dateString: string): Timestamp => {
  const date = new Date(dateString);
  return Timestamp.fromDate(date);
};

/**
 * Creates a timestamp for today
 * @returns A Firestore timestamp for today
 */
export const createTodayTimestamp = (): Timestamp => {
  return Timestamp.now();
};

/**
 * Creates a timestamp for yesterday
 * @returns A Firestore timestamp for yesterday
 */
export const createYesterdayTimestamp = (): Timestamp => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return Timestamp.fromDate(yesterday);
};

/**
 * Creates a timestamp for tomorrow
 * @returns A Firestore timestamp for tomorrow
 */
export const createTomorrowTimestamp = (): Timestamp => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return Timestamp.fromDate(tomorrow);
};

/**
 * Creates a valid rating document for testing
 * @param groupId - The group ID
 * @param userId - The user ID
 * @param ratingDate - The date of the rating in YYYY-MM-DD format
 * @param overrides - Optional overrides for the default values
 * @returns A valid rating document
 */
export const createValidRating = (
  groupId: string,
  userId: string,
  ratingDate: string,
  overrides: Partial<Rating> = {}
): Rating => {
  const now = Timestamp.now();
  const ratingId = `${groupId}_${ratingDate}_${userId}`;

  return {
    ratingId,
    groupId,
    userId,
    ratingDate,
    ratingNumber: 5,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};
