import { securityRulesTestEnv } from '../testEnvironment';
import { createValidGroup, createValidGroupMember, createValidRating } from '../testHelpers';
import { GroupMemberRole } from '../../../src/types/GroupMemberRole';

describe('Ratings Collection Security Rules', () => {
  // Test user IDs
  const CREATOR_USER_ID = 'creator-user';
  const MEMBER_USER_ID = 'member-user';
  const OTHER_USER_ID = 'other-user';

  // Test group ID
  const TEST_GROUP_ID = 'test-group';

  // Test rating date
  const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

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

      // Create a group member for the creator
      const creatorMember = createValidGroupMember(
        TEST_GROUP_ID,
        CREATOR_USER_ID,
        GroupMemberRole.ADMIN
      );

      // Set up the group member in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groupMembers')
        .doc(`${TEST_GROUP_ID}_${CREATOR_USER_ID}`)
        .set(creatorMember);

      // Create a group member for the regular member
      const memberGroupMember = createValidGroupMember(
        TEST_GROUP_ID,
        MEMBER_USER_ID,
        GroupMemberRole.MEMBER
      );

      // Set up the group member in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(MEMBER_USER_ID)
        .firestore()
        .collection('groupMembers')
        .doc(`${TEST_GROUP_ID}_${MEMBER_USER_ID}`)
        .set(memberGroupMember);

      // Create a rating
      const testRating = createValidRating(TEST_GROUP_ID, MEMBER_USER_ID, TODAY);

      // Set up the rating in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(MEMBER_USER_ID)
        .firestore()
        .collection('ratings')
        .doc(testRating.ratingId)
        .set(testRating);
    });

    it('should allow authenticated users to read ratings', async () => {
      const testRating = createValidRating(TEST_GROUP_ID, MEMBER_USER_ID, TODAY);

      // Test that an authenticated user can read a rating
      await securityRulesTestEnv.assertSucceeds(
        securityRulesTestEnv
          .getAuthenticatedContext(OTHER_USER_ID)
          .firestore()
          .collection('ratings')
          .doc(testRating.ratingId)
          .get()
      );
    });

    it('should not allow unauthenticated users to read ratings', async () => {
      const testRating = createValidRating(TEST_GROUP_ID, MEMBER_USER_ID, TODAY);

      // Test that an unauthenticated user cannot read a rating
      await securityRulesTestEnv.assertFails(
        securityRulesTestEnv
          .getUnauthenticatedContext()
          .firestore()
          .collection('ratings')
          .doc(testRating.ratingId)
          .get()
      );
    });
  });

  describe('Create Operations', () => {
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

      // Create a group member for the member
      const memberGroupMember = createValidGroupMember(
        TEST_GROUP_ID,
        MEMBER_USER_ID,
        GroupMemberRole.MEMBER
      );

      // Set up the group member in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(MEMBER_USER_ID)
        .firestore()
        .collection('groupMembers')
        .doc(`${TEST_GROUP_ID}_${MEMBER_USER_ID}`)
        .set(memberGroupMember);
    });

    it('should allow group members to create ratings', async () => {
      const testRating = createValidRating(TEST_GROUP_ID, MEMBER_USER_ID, TODAY);

      // Test that a group member can create a rating
      await securityRulesTestEnv.assertSucceeds(
        securityRulesTestEnv
          .getAuthenticatedContext(MEMBER_USER_ID)
          .firestore()
          .collection('ratings')
          .doc(testRating.ratingId)
          .set(testRating)
      );
    });

    it('should not allow non-group members to create ratings', async () => {
      const testRating = createValidRating(TEST_GROUP_ID, OTHER_USER_ID, TODAY);

      // Test that a non-group member cannot create a rating
      await securityRulesTestEnv.assertFails(
        securityRulesTestEnv
          .getAuthenticatedContext(OTHER_USER_ID)
          .firestore()
          .collection('ratings')
          .doc(testRating.ratingId)
          .set(testRating)
      );
    });

    it('should not allow users to create ratings for other users', async () => {
      const testRating = createValidRating(TEST_GROUP_ID, OTHER_USER_ID, TODAY);

      // Test that a user cannot create a rating for another user
      await securityRulesTestEnv.assertFails(
        securityRulesTestEnv
          .getAuthenticatedContext(MEMBER_USER_ID)
          .firestore()
          .collection('ratings')
          .doc(testRating.ratingId)
          .set(testRating)
      );
    });

    it('should not allow users to create multiple ratings for the same day', async () => {
      const testRating = createValidRating(TEST_GROUP_ID, MEMBER_USER_ID, TODAY);

      // Create the first rating
      await securityRulesTestEnv
        .getAuthenticatedContext(MEMBER_USER_ID)
        .firestore()
        .collection('ratings')
        .doc(testRating.ratingId)
        .set(testRating);

      // Test that a user cannot create a second rating for the same day
      await securityRulesTestEnv.assertFails(
        securityRulesTestEnv
          .getAuthenticatedContext(MEMBER_USER_ID)
          .firestore()
          .collection('ratings')
          .doc(testRating.ratingId)
          .set(testRating)
      );
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

      // Create a group member for the creator
      const creatorMember = createValidGroupMember(
        TEST_GROUP_ID,
        CREATOR_USER_ID,
        GroupMemberRole.ADMIN
      );

      // Set up the group member in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(CREATOR_USER_ID)
        .firestore()
        .collection('groupMembers')
        .doc(`${TEST_GROUP_ID}_${CREATOR_USER_ID}`)
        .set(creatorMember);

      // Create a group member for the regular member
      const memberGroupMember = createValidGroupMember(
        TEST_GROUP_ID,
        MEMBER_USER_ID,
        GroupMemberRole.MEMBER
      );

      // Set up the group member in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(MEMBER_USER_ID)
        .firestore()
        .collection('groupMembers')
        .doc(`${TEST_GROUP_ID}_${MEMBER_USER_ID}`)
        .set(memberGroupMember);

      // Create a rating
      const testRating = createValidRating(TEST_GROUP_ID, MEMBER_USER_ID, TODAY);

      // Set up the rating in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(MEMBER_USER_ID)
        .firestore()
        .collection('ratings')
        .doc(testRating.ratingId)
        .set(testRating);
    });

    it('should allow the rating owner to delete their own rating', async () => {
      const testRating = createValidRating(TEST_GROUP_ID, MEMBER_USER_ID, TODAY);

      // Test that the rating owner can delete their own rating
      await securityRulesTestEnv.assertSucceeds(
        securityRulesTestEnv
          .getAuthenticatedContext(MEMBER_USER_ID)
          .firestore()
          .collection('ratings')
          .doc(testRating.ratingId)
          .delete()
      );
    });

    it('should allow the group creator to delete any rating in their group', async () => {
      const testRating = createValidRating(TEST_GROUP_ID, MEMBER_USER_ID, TODAY);

      // Test that the group creator can delete any rating in their group
      await securityRulesTestEnv.assertSucceeds(
        securityRulesTestEnv
          .getAuthenticatedContext(CREATOR_USER_ID)
          .firestore()
          .collection('ratings')
          .doc(testRating.ratingId)
          .delete()
      );
    });

    it('should not allow other users to delete ratings', async () => {
      const testRating = createValidRating(TEST_GROUP_ID, MEMBER_USER_ID, TODAY);

      // Test that other users cannot delete ratings
      await securityRulesTestEnv.assertFails(
        securityRulesTestEnv
          .getAuthenticatedContext(OTHER_USER_ID)
          .firestore()
          .collection('ratings')
          .doc(testRating.ratingId)
          .delete()
      );
    });
  });
});
