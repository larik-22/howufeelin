import * as fs from 'fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
  RulesTestContext,
} from '@firebase/rules-unit-testing';
import { Timestamp } from 'firebase/firestore';
import { GroupMemberRole } from '../src/types/GroupMemberRole';

describe('Firebase Security Rules', () => {
  let testEnv: RulesTestEnvironment;
  let aliceContext: RulesTestContext;
  let bobContext: RulesTestContext;
  let unauthenticatedContext: RulesTestContext;

  // Test data
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    userId: 'alice',
  };

  const testGroup = {
    groupName: 'Test Group',
    joinCode: 'TEST123',
    groupId: 'group1',
  };

  // Group member test data
  const aliceGroupMember = {
    displayName: 'Alice Smith',
    email: 'alice@example.com',
    groupId: 'group1',
    joinedAt: Timestamp.now(),
    photoURL: 'https://example.com/alice.jpg',
    role: GroupMemberRole.ADMIN,
    userId: 'alice',
  };

  const bobGroupMember = {
    displayName: 'Bob Johnson',
    email: 'bob@example.com',
    groupId: 'group1',
    joinedAt: Timestamp.now(),
    photoURL: 'https://example.com/bob.jpg',
    role: GroupMemberRole.MEMBER,
    userId: 'bob',
  };

  beforeAll(async () => {
    // Initialize the test environment
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-' + Date.now(),
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });

    // Create test contexts for authenticated and unauthenticated users
    aliceContext = testEnv.authenticatedContext('alice', { auth: { uid: 'alice' } });
    bobContext = testEnv.authenticatedContext('bob', { auth: { uid: 'bob' } });
    unauthenticatedContext = testEnv.unauthenticatedContext();
  });

  afterAll(async () => {
    // Clean up the test environment
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    // Clear Firestore data before each test
    await testEnv.clearFirestore();
  });

  // ===== USERS COLLECTION TESTS =====
  describe('Users Collection', () => {
    test('should prevent creating user with invalid email', async () => {
      await assertFails(
        aliceContext
          .firestore()
          .collection('users')
          .doc('alice')
          .set({
            ...testUser,
            email: 'invalid-email',
            createdAt: Timestamp.now(),
          })
      );
    });

    test('should prevent creating user with invalid username', async () => {
      await assertFails(
        aliceContext
          .firestore()
          .collection('users')
          .doc('alice')
          .set({
            ...testUser,
            username: 'a', // Too short
            createdAt: Timestamp.now(),
          })
      );
    });
  });

  // ===== GROUPS COLLECTION TESTS =====
  describe('Groups Collection', () => {
    test('should allow creating group with valid data', async () => {
      await assertSucceeds(
        aliceContext
          .firestore()
          .collection('groups')
          .doc('group1')
          .set({
            ...testGroup,
            createdAt: Timestamp.now(),
            createdBy: 'alice',
          })
      );
    });

    test('should prevent creating group with invalid name', async () => {
      await assertFails(
        aliceContext
          .firestore()
          .collection('groups')
          .doc('group1')
          .set({
            ...testGroup,
            groupName: 'ab', // Too short
            createdAt: Timestamp.now(),
            createdBy: 'alice',
          })
      );
    });

    test('should prevent creating group with invalid join code', async () => {
      await assertFails(
        aliceContext
          .firestore()
          .collection('groups')
          .doc('group1')
          .set({
            ...testGroup,
            joinCode: '123', // Too short
            createdAt: Timestamp.now(),
            createdBy: 'alice',
          })
      );
    });
  });
});
