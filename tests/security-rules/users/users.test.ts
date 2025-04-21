import { Timestamp } from 'firebase/firestore';
import { securityRulesTestEnv } from '../testEnvironment';
import { createValidUser, createTodayTimestamp, createTomorrowTimestamp } from '../testHelpers';
import { MyUser } from '../../../src/types/MyUser';

describe('Users Collection Security Rules', () => {
  // Test user IDs
  const TEST_USER_ID = 'test-user';
  const OTHER_USER_ID = 'other-user';

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
    test('should allow authenticated users to read any user document', async () => {
      // Create a test user document
      const testUser = createValidUser(TEST_USER_ID);

      // Set up the document in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .set(testUser);

      // Try to read the document as another authenticated user
      const readOperation = securityRulesTestEnv
        .getAuthenticatedContext(OTHER_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .get();

      // Assert that the read operation succeeds
      await securityRulesTestEnv.assertSucceeds(readOperation);
    });

    test('should prevent unauthenticated users from reading user documents', async () => {
      // Create a test user document
      const testUser = createValidUser(TEST_USER_ID);

      // Set up the document in Firestore
      await securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .set(testUser);

      // Try to read the document as an unauthenticated user
      const readOperation = securityRulesTestEnv
        .getUnauthenticatedContext()
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .get();

      // Assert that the read operation fails
      await securityRulesTestEnv.assertFails(readOperation);
    });
  });

  describe('Create Operations', () => {
    test('should allow authenticated users to create their own user document with valid data', async () => {
      // Create a valid user document
      const testUser = createValidUser(TEST_USER_ID);

      // Try to create the document
      const createOperation = securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .set(testUser);

      // Assert that the create operation succeeds
      await securityRulesTestEnv.assertSucceeds(createOperation);
    });

    test('should prevent authenticated users from creating a user document with mismatched userId', async () => {
      // Create a user document with a mismatched userId
      const testUser = createValidUser(OTHER_USER_ID);

      // Try to create the document as a different user
      const createOperation = securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .set(testUser);

      // Assert that the create operation fails
      await securityRulesTestEnv.assertFails(createOperation);
    });

    test('should prevent unauthenticated users from creating user documents', async () => {
      // Create a valid user document
      const testUser = createValidUser(TEST_USER_ID);

      // Try to create the document as an unauthenticated user
      const createOperation = securityRulesTestEnv
        .getUnauthenticatedContext()
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .set(testUser);

      // Assert that the create operation fails
      await securityRulesTestEnv.assertFails(createOperation);
    });

    test('should prevent creating a user document with missing required fields', async () => {
      // Create an invalid user document (missing required fields)
      const invalidUser: Partial<MyUser> = {
        userId: TEST_USER_ID,
        // Missing username, email, displayName
        photoURL: null,
        createdAt: createTodayTimestamp(),
        updatedAt: createTodayTimestamp(),
      };

      // Try to create the document
      const createOperation = securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .set(invalidUser);

      // Assert that the create operation fails
      await securityRulesTestEnv.assertFails(createOperation);
    });

    test('should prevent creating a user document with future timestamps', async () => {
      // Create a user document with future timestamps
      const testUser = createValidUser(TEST_USER_ID, {
        createdAt: createTomorrowTimestamp(),
        updatedAt: createTomorrowTimestamp(),
      });

      // Try to create the document
      const createOperation = securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .set(testUser);

      // Assert that the create operation fails
      await securityRulesTestEnv.assertFails(createOperation);
    });

    test('should prevent creating a user document with mismatched createdAt and updatedAt', async () => {
      // Create a user document with mismatched timestamps
      const testUser = createValidUser(TEST_USER_ID, {
        createdAt: createTodayTimestamp(),
        updatedAt: Timestamp.fromDate(new Date(Date.now() + 1000)), // 1 second later
      });

      // Try to create the document
      const createOperation = securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .set(testUser);

      // Assert that the create operation fails
      await securityRulesTestEnv.assertFails(createOperation);
    });
  });

  describe('Update Operations', () => {
    beforeEach(async () => {
      // Set up a test user document before each update test
      const testUser = createValidUser(TEST_USER_ID);
      await securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .set(testUser);
    });

    test('should allow users to update their own user document with valid data', async () => {
      // Create a valid update
      const updateData = {
        displayName: 'Updated Name',
        updatedAt: createTodayTimestamp(),
      };

      // Try to update the document
      const updateOperation = securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .update(updateData);

      // Assert that the update operation succeeds
      await securityRulesTestEnv.assertSucceeds(updateOperation);
    });

    test("should prevent users from updating other users' documents", async () => {
      // Create a valid update
      const updateData = {
        displayName: 'Updated Name',
        updatedAt: createTodayTimestamp(),
      };

      // Try to update another user's document
      const updateOperation = securityRulesTestEnv
        .getAuthenticatedContext(OTHER_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .update(updateData);

      // Assert that the update operation fails
      await securityRulesTestEnv.assertFails(updateOperation);
    });

    test('should prevent unauthenticated users from updating user documents', async () => {
      // Create a valid update
      const updateData = {
        displayName: 'Updated Name',
        updatedAt: createTodayTimestamp(),
      };

      // Try to update the document as an unauthenticated user
      const updateOperation = securityRulesTestEnv
        .getUnauthenticatedContext()
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .update(updateData);

      // Assert that the update operation fails
      await securityRulesTestEnv.assertFails(updateOperation);
    });

    test('should prevent updating userId field', async () => {
      // Try to update the userId field
      const updateData = {
        userId: OTHER_USER_ID,
        updatedAt: createTodayTimestamp(),
      };

      // Try to update the document
      const updateOperation = securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .update(updateData);

      // Assert that the update operation fails
      await securityRulesTestEnv.assertFails(updateOperation);
    });

    test('should prevent updating createdAt field', async () => {
      // Try to update the createdAt field
      const updateData = {
        createdAt: createTodayTimestamp(),
        updatedAt: createTodayTimestamp(),
      };

      // Try to update the document
      const updateOperation = securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .update(updateData);

      // Assert that the update operation fails
      await securityRulesTestEnv.assertFails(updateOperation);
    });

    test('should prevent updating with future timestamps', async () => {
      // Try to update with future timestamps
      const updateData = {
        displayName: 'Updated Name',
        updatedAt: createTomorrowTimestamp(),
      };

      // Try to update the document
      const updateOperation = securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .update(updateData);

      // Assert that the update operation fails
      await securityRulesTestEnv.assertFails(updateOperation);
    });

    test('should prevent updating with timestamps older than the current updatedAt', async () => {
      // First, get the current document to check its updatedAt
      const currentDoc = await securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .get();

      const currentUpdatedAt = currentDoc.data()?.updatedAt as Timestamp;

      // Create a timestamp slightly older than the current updatedAt
      const olderTimestamp = Timestamp.fromDate(
        new Date(currentUpdatedAt.toDate().getTime() - 1000)
      );

      // Try to update with an older timestamp
      const updateData = {
        displayName: 'Updated Name',
        updatedAt: olderTimestamp,
      };

      // Try to update the document
      const updateOperation = securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .update(updateData);

      // Assert that the update operation fails
      await securityRulesTestEnv.assertFails(updateOperation);
    });
  });

  describe('Delete Operations', () => {
    beforeEach(async () => {
      // Set up a test user document before each delete test
      const testUser = createValidUser(TEST_USER_ID);
      await securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .set(testUser);
    });

    test('should allow users to delete their own user document', async () => {
      // Try to delete the document
      const deleteOperation = securityRulesTestEnv
        .getAuthenticatedContext(TEST_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .delete();

      // Assert that the delete operation succeeds
      await securityRulesTestEnv.assertSucceeds(deleteOperation);
    });

    test("should prevent users from deleting other users' documents", async () => {
      // Try to delete another user's document
      const deleteOperation = securityRulesTestEnv
        .getAuthenticatedContext(OTHER_USER_ID)
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .delete();

      // Assert that the delete operation fails
      await securityRulesTestEnv.assertFails(deleteOperation);
    });

    test('should prevent unauthenticated users from deleting user documents', async () => {
      // Try to delete the document as an unauthenticated user
      const deleteOperation = securityRulesTestEnv
        .getUnauthenticatedContext()
        .firestore()
        .collection('users')
        .doc(TEST_USER_ID)
        .delete();

      // Assert that the delete operation fails
      await securityRulesTestEnv.assertFails(deleteOperation);
    });
  });
});
