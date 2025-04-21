import { securityRulesTestEnv } from '../testEnvironment';
import {
  createValidGroup,
  createValidGroupMember,
  createTodayTimestamp,
  createTomorrowTimestamp,
} from '../testHelpers';
import { Group } from '../../../src/types/Group';
import { GroupMemberRole } from '../../../src/types/GroupMemberRole';

describe('Groups Collection Security Rules', () => {
  // Test user IDs
  const CREATOR_USER_ID = 'creator-user';
  const ADMIN_USER_ID = 'admin-user';
  const MEMBER_USER_ID = 'member-user';
  const OTHER_USER_ID = 'other-user';

  // Test group ID
  const TEST_GROUP_ID = 'test-group';

  // Initialize test environment before all tests
  beforeAll(async () => {
    await securityRulesTestEnv.initialize();
  });

  // Clean up after all tests
  afterAll(async () => {
    await securityRulesTestEnv.cleanup();
  });

  // Clear Firestore data before each test
  beforeEach(async () => {
    await securityRulesTestEnv.clearFirestore();
  });

  describe('Read Operations', () => {
    beforeEach(async () => {
      // Create a test group
      const testGroup = createValidGroup(TEST_GROUP_ID, CREATOR_USER_ID);

      // Set up the group in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .set(testGroup);

      // Create a group member for the admin user
      const adminMember = createValidGroupMember(
        TEST_GROUP_ID,
        ADMIN_USER_ID,
        GroupMemberRole.ADMIN
      );

      // Set up the group member in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groupMembers')
        .doc(`${TEST_GROUP_ID}_${ADMIN_USER_ID}`)
        .set(adminMember);
    });

    test('should allow authenticated users to read a group they are not banned from', async () => {
      // Try to read the group as a non-member
      const readOperation = securityRulesTestEnv
        .getAuthenticatedContext(OTHER_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .get();

      // Assert that the read operation succeeds
      await securityRulesTestEnv.assertSucceeds(readOperation);
    });

    test('should prevent authenticated users from reading a group they are banned from', async () => {
      // Create a banned member
      const bannedMember = createValidGroupMember(
        TEST_GROUP_ID,
        OTHER_USER_ID,
        GroupMemberRole.BANNED
      );

      // Set up the banned member in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groupMembers')
        .doc(`${TEST_GROUP_ID}_${OTHER_USER_ID}`)
        .set(bannedMember);

      // Try to read the group as a banned member
      const readOperation = securityRulesTestEnv
        .getAuthenticatedContext(OTHER_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .get();

      // Assert that the read operation fails
      await securityRulesTestEnv.assertFails(readOperation);
    });

    test('should prevent unauthenticated users from reading groups', async () => {
      // Try to read the group as an unauthenticated user
      const readOperation = securityRulesTestEnv
        .getUnauthenticatedContext()
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .get();

      // Assert that the read operation fails
      await securityRulesTestEnv.assertFails(readOperation);
    });
  });

  describe('Create Operations', () => {
    test('should allow authenticated users to create a group with valid data', async () => {
      // Create a valid group
      const testGroup = createValidGroup(TEST_GROUP_ID, CREATOR_USER_ID);

      // Try to create the group
      const createOperation = securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .set(testGroup);

      // Assert that the create operation succeeds
      await securityRulesTestEnv.assertSucceeds(createOperation);
    });

    test('should prevent creating a group with invalid data', async () => {
      // Create an invalid group (missing required fields)
      const invalidGroup: Partial<Group> = {
        groupId: TEST_GROUP_ID,
        // Missing groupName, groupDescription, createdBy
        createdAt: createTodayTimestamp(),
        updatedAt: createTodayTimestamp(),
        joinCode: 'ABC123',
      };

      // Try to create the group
      const createOperation = securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .set(invalidGroup);

      // Assert that the create operation fails
      await securityRulesTestEnv.assertFails(createOperation);
    });

    test('should prevent creating a group with future timestamps', async () => {
      // Create a group with future timestamps
      const testGroup = createValidGroup(TEST_GROUP_ID, CREATOR_USER_ID, {
        createdAt: createTomorrowTimestamp(),
        updatedAt: createTomorrowTimestamp(),
      });

      // Try to create the group
      const createOperation = securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .set(testGroup);

      // Assert that the create operation fails
      await securityRulesTestEnv.assertFails(createOperation);
    });

    test('should prevent unauthenticated users from creating groups', async () => {
      // Create a valid group
      const testGroup = createValidGroup(TEST_GROUP_ID, CREATOR_USER_ID);

      // Try to create the group as an unauthenticated user
      const createOperation = securityRulesTestEnv
        .getUnauthenticatedContext()
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .set(testGroup);

      // Assert that the create operation fails
      await securityRulesTestEnv.assertFails(createOperation);
    });
  });

  describe('Update Operations', () => {
    beforeEach(async () => {
      // Create a test group
      const testGroup = createValidGroup(TEST_GROUP_ID, CREATOR_USER_ID);

      // Set up the group in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .set(testGroup);

      // Create group members for the admin and member users
      const adminMember = createValidGroupMember(
        TEST_GROUP_ID,
        ADMIN_USER_ID,
        GroupMemberRole.ADMIN
      );
      const memberMember = createValidGroupMember(
        TEST_GROUP_ID,
        MEMBER_USER_ID,
        GroupMemberRole.MEMBER
      );

      // Set up the group members in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groupMembers')
        .doc(`${TEST_GROUP_ID}_${ADMIN_USER_ID}`)
        .set(adminMember);

      await securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groupMembers')
        .doc(`${TEST_GROUP_ID}_${MEMBER_USER_ID}`)
        .set(memberMember);
    });

    test('should allow group creator to update the group', async () => {
      // Create a valid update
      const updateData = {
        groupName: 'Updated Group Name',
        updatedAt: createTodayTimestamp(),
      };

      // Try to update the group as the creator
      const updateOperation = securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .update(updateData);

      // Assert that the update operation succeeds
      await securityRulesTestEnv.assertSucceeds(updateOperation);
    });

    test('should allow group admin to update the group', async () => {
      // Create a valid update
      const updateData = {
        groupName: 'Updated Group Name',
        updatedAt: createTodayTimestamp(),
      };

      // Try to update the group as an admin
      const updateOperation = securityRulesTestEnv
        .getAuthenticatedContext(ADMIN_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .update(updateData);

      // Assert that the update operation succeeds
      await securityRulesTestEnv.assertSucceeds(updateOperation);
    });

    test('should prevent regular members from updating the group', async () => {
      // Create a valid update
      const updateData = {
        groupName: 'Updated Group Name',
        updatedAt: createTodayTimestamp(),
      };

      // Try to update the group as a regular member
      const updateOperation = securityRulesTestEnv
        .getAuthenticatedContext(MEMBER_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .update(updateData);

      // Assert that the update operation fails
      await securityRulesTestEnv.assertFails(updateOperation);
    });

    test('should prevent updating createdBy field', async () => {
      // Try to update the createdBy field
      const updateData = {
        createdBy: OTHER_USER_ID,
        updatedAt: createTodayTimestamp(),
      };

      // Try to update the group as the creator
      const updateOperation = securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .update(updateData);

      // Assert that the update operation fails
      await securityRulesTestEnv.assertFails(updateOperation);
    });
  });

  describe('Delete Operations', () => {
    beforeEach(async () => {
      // Create a test group
      const testGroup = createValidGroup(TEST_GROUP_ID, CREATOR_USER_ID);

      // Set up the group in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .set(testGroup);

      // Create group members for the admin and member users
      const adminMember = createValidGroupMember(
        TEST_GROUP_ID,
        ADMIN_USER_ID,
        GroupMemberRole.ADMIN
      );
      const memberMember = createValidGroupMember(
        TEST_GROUP_ID,
        MEMBER_USER_ID,
        GroupMemberRole.MEMBER
      );

      // Set up the group members in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groupMembers')
        .doc(`${TEST_GROUP_ID}_${ADMIN_USER_ID}`)
        .set(adminMember);

      await securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groupMembers')
        .doc(`${TEST_GROUP_ID}_${MEMBER_USER_ID}`)
        .set(memberMember);
    });

    test('should allow group creator to delete the group', async () => {
      // Try to delete the group as the creator
      const deleteOperation = securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .delete();

      // Assert that the delete operation succeeds
      await securityRulesTestEnv.assertSucceeds(deleteOperation);
    });

    test('should allow group admin to delete the group', async () => {
      // Try to delete the group as an admin
      const deleteOperation = securityRulesTestEnv
        .getAuthenticatedContext(ADMIN_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .delete();

      // Assert that the delete operation succeeds
      await securityRulesTestEnv.assertSucceeds(deleteOperation);
    });

    test('should prevent regular members from deleting the group', async () => {
      // Try to delete the group as a regular member
      const deleteOperation = securityRulesTestEnv
        .getAuthenticatedContext(MEMBER_USER_ID)
        .firestore()
        .collection('groups')
        .doc(TEST_GROUP_ID)
        .delete();

      // Assert that the delete operation fails
      await securityRulesTestEnv.assertFails(deleteOperation);
    });
  });
});
