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
  };

  const testGroup = {
    groupName: 'Test Group',
    joinCode: 'TEST123',
    groupId: 'group1',
  };

  beforeAll(async () => {
    // Initialize the test environment
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-project-1234',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
        host: 'localhost',
        port: 8080,
      },
    });

    // Create test contexts
    aliceContext = testEnv.authenticatedContext('alice');
    bobContext = testEnv.authenticatedContext('bob');
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
    test('should allow authenticated user to read any user document', async () => {
      // First create a user
      await aliceContext
        .firestore()
        .collection('users')
        .doc('alice')
        .set({
          ...testUser,
          createdAt: Timestamp.now(),
        });

      // Then try to read it with another authenticated user
      await assertSucceeds(bobContext.firestore().collection('users').doc('alice').get());
    });

    test('should prevent unauthenticated user from reading user documents', async () => {
      // First create a user
      await aliceContext
        .firestore()
        .collection('users')
        .doc('alice')
        .set({
          ...testUser,
          createdAt: Timestamp.now(),
        });

      // Then try to read it with an unauthenticated user
      await assertFails(unauthenticatedContext.firestore().collection('users').doc('alice').get());
    });

    test('should allow user to create their own document with valid data', async () => {
      await assertSucceeds(
        aliceContext
          .firestore()
          .collection('users')
          .doc('alice')
          .set({
            ...testUser,
            createdAt: Timestamp.now(),
          })
      );
    });

    test('should prevent user from creating document for another user', async () => {
      await assertFails(
        aliceContext
          .firestore()
          .collection('users')
          .doc('bob')
          .set({
            ...testUser,
            createdAt: Timestamp.now(),
          })
      );
    });

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

    test('should allow user to update their own document', async () => {
      // First create a user
      await aliceContext
        .firestore()
        .collection('users')
        .doc('alice')
        .set({
          ...testUser,
          createdAt: Timestamp.now(),
        });

      // Then update it
      await assertSucceeds(
        aliceContext.firestore().collection('users').doc('alice').update({
          displayName: 'Alice Smith',
          updatedAt: Timestamp.now(),
        })
      );
    });

    test("should prevent user from updating another user's document", async () => {
      // First create a user
      await aliceContext
        .firestore()
        .collection('users')
        .doc('alice')
        .set({
          ...testUser,
          createdAt: Timestamp.now(),
        });

      // Then try to update it with another user
      await assertFails(
        bobContext.firestore().collection('users').doc('alice').update({
          displayName: 'Hacked Name',
          updatedAt: Timestamp.now(),
        })
      );
    });

    test('should prevent user from changing their email', async () => {
      // First create a user
      await aliceContext
        .firestore()
        .collection('users')
        .doc('alice')
        .set({
          ...testUser,
          createdAt: Timestamp.now(),
        });

      // Then try to update email
      await assertFails(
        aliceContext.firestore().collection('users').doc('alice').update({
          email: 'newemail@example.com',
          updatedAt: Timestamp.now(),
        })
      );
    });

    test('should prevent user from deleting their document', async () => {
      // First create a user
      await aliceContext
        .firestore()
        .collection('users')
        .doc('alice')
        .set({
          ...testUser,
          createdAt: Timestamp.now(),
        });

      // Then try to delete it
      await assertFails(aliceContext.firestore().collection('users').doc('alice').delete());
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

    test('should prevent non-member from reading group document', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Then try to read it with a non-member
      await assertFails(bobContext.firestore().collection('groups').doc('group1').get());
    });

    test('should allow group admin to update group', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member with admin role
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.ADMIN,
        joinedAt: Timestamp.now(),
      });

      // Then update the group
      await assertSucceeds(
        aliceContext.firestore().collection('groups').doc('group1').update({
          groupName: 'Updated Group Name',
          updatedAt: Timestamp.now(),
        })
      );
    });

    test('should prevent non-admin from updating group', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member with member role - using bobContext instead of aliceContext
      await bobContext.firestore().collection('groupMembers').doc('bob_group1').set({
        groupId: 'group1',
        userId: 'bob',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Then try to update the group
      await assertFails(
        bobContext.firestore().collection('groups').doc('group1').update({
          groupName: 'Hacked Group Name',
          updatedAt: Timestamp.now(),
        })
      );
    });

    test('should allow group admin to delete group', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member with admin role
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.ADMIN,
        joinedAt: Timestamp.now(),
      });

      // Then delete the group
      await assertSucceeds(aliceContext.firestore().collection('groups').doc('group1').delete());
    });

    test('should prevent non-admin from deleting group', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member with member role - using bobContext instead of aliceContext
      await bobContext.firestore().collection('groupMembers').doc('bob_group1').set({
        groupId: 'group1',
        userId: 'bob',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Then try to delete the group
      await assertFails(bobContext.firestore().collection('groups').doc('group1').delete());
    });
  });

  // ===== GROUP MEMBERS COLLECTION TESTS =====
  describe('Group Members Collection', () => {
    test('should allow user to join a group with valid role', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Then join the group
      await assertSucceeds(
        bobContext.firestore().collection('groupMembers').doc('bob_group1').set({
          groupId: 'group1',
          userId: 'bob',
          role: GroupMemberRole.MEMBER,
          joinedAt: Timestamp.now(),
        })
      );
    });

    test('should prevent joining with invalid role', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Then try to join with invalid role
      await assertFails(
        bobContext.firestore().collection('groupMembers').doc('bob_group1').set({
          groupId: 'group1',
          userId: 'bob',
          role: 'INVALID_ROLE',
          joinedAt: Timestamp.now(),
        })
      );
    });

    test('should allow group admin to update member role', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member with admin role
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.ADMIN,
        joinedAt: Timestamp.now(),
      });

      // Create another member - using bobContext instead of aliceContext
      await bobContext.firestore().collection('groupMembers').doc('bob_group1').set({
        groupId: 'group1',
        userId: 'bob',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Then update the member role
      await assertSucceeds(
        aliceContext.firestore().collection('groupMembers').doc('bob_group1').update({
          role: GroupMemberRole.MODERATOR,
          updatedAt: Timestamp.now(),
        })
      );
    });

    test('should prevent non-admin from updating member role', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member with admin role
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.ADMIN,
        joinedAt: Timestamp.now(),
      });

      // Create another member - using bobContext instead of aliceContext
      await bobContext.firestore().collection('groupMembers').doc('bob_group1').set({
        groupId: 'group1',
        userId: 'bob',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Then try to update the member role
      await assertFails(
        bobContext.firestore().collection('groupMembers').doc('alice_group1').update({
          role: GroupMemberRole.MEMBER,
          updatedAt: Timestamp.now(),
        })
      );
    });

    test('should allow user to leave their own group membership', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member - using bobContext instead of aliceContext
      await bobContext.firestore().collection('groupMembers').doc('bob_group1').set({
        groupId: 'group1',
        userId: 'bob',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Then delete the membership
      await assertSucceeds(
        bobContext.firestore().collection('groupMembers').doc('bob_group1').delete()
      );
    });

    test('should allow admin to remove any member', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member with admin role
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.ADMIN,
        joinedAt: Timestamp.now(),
      });

      // Create another member - using bobContext instead of aliceContext
      await bobContext.firestore().collection('groupMembers').doc('bob_group1').set({
        groupId: 'group1',
        userId: 'bob',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Then delete the member
      await assertSucceeds(
        aliceContext.firestore().collection('groupMembers').doc('bob_group1').delete()
      );
    });
  });

  // ===== RATINGS COLLECTION TESTS =====
  describe('Ratings Collection', () => {
    test('should allow group member to create a rating', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Then create a rating
      const today = new Date().toISOString().split('T')[0];
      await assertSucceeds(
        aliceContext.firestore().collection('ratings').doc(`alice_group1_${today}`).set({
          userId: 'alice',
          groupId: 'group1',
          rating: 4,
          date: today,
          createdAt: Timestamp.now(),
        })
      );
    });

    test('should prevent non-member from creating a rating', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Then try to create a rating
      const today = new Date().toISOString().split('T')[0];
      await assertFails(
        bobContext.firestore().collection('ratings').doc(`bob_group1_${today}`).set({
          userId: 'bob',
          groupId: 'group1',
          rating: 4,
          date: today,
          createdAt: Timestamp.now(),
        })
      );
    });

    test('should prevent creating a rating with invalid value', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Then try to create a rating with invalid value
      const today = new Date().toISOString().split('T')[0];
      await assertFails(
        aliceContext.firestore().collection('ratings').doc(`alice_group1_${today}`).set({
          userId: 'alice',
          groupId: 'group1',
          rating: 6, // Invalid rating
          date: today,
          createdAt: Timestamp.now(),
        })
      );
    });

    test('should prevent creating a rating with invalid date format', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Then try to create a rating with invalid date format
      await assertFails(
        aliceContext.firestore().collection('ratings').doc('alice_group1_2023-01-01').set({
          userId: 'alice',
          groupId: 'group1',
          rating: 4,
          date: '2023/01/01', // Invalid date format
          createdAt: Timestamp.now(),
        })
      );
    });

    test('should prevent creating duplicate ratings for the same day', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Create a rating
      const today = new Date().toISOString().split('T')[0];
      await aliceContext.firestore().collection('ratings').doc(`alice_group1_${today}`).set({
        userId: 'alice',
        groupId: 'group1',
        rating: 4,
        date: today,
        createdAt: Timestamp.now(),
      });

      // Then try to create another rating for the same day
      await assertFails(
        aliceContext.firestore().collection('ratings').doc(`alice_group1_${today}_2`).set({
          userId: 'alice',
          groupId: 'group1',
          rating: 5,
          date: today,
          createdAt: Timestamp.now(),
        })
      );
    });

    test('should prevent user from updating their own rating', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Create a rating
      const today = new Date().toISOString().split('T')[0];
      await aliceContext.firestore().collection('ratings').doc(`alice_group1_${today}`).set({
        userId: 'alice',
        groupId: 'group1',
        rating: 4,
        date: today,
        createdAt: Timestamp.now(),
      });

      // Then try to update the rating - should fail because updates are not allowed
      await assertFails(
        aliceContext.firestore().collection('ratings').doc(`alice_group1_${today}`).update({
          rating: 5,
          updatedAt: Timestamp.now(),
        })
      );
    });

    test("should prevent user from updating another user's rating", async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group members
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      await bobContext.firestore().collection('groupMembers').doc('bob_group1').set({
        groupId: 'group1',
        userId: 'bob',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Create ratings
      const today = new Date().toISOString().split('T')[0];
      await aliceContext.firestore().collection('ratings').doc(`alice_group1_${today}`).set({
        userId: 'alice',
        groupId: 'group1',
        rating: 4,
        date: today,
        createdAt: Timestamp.now(),
      });

      await bobContext.firestore().collection('ratings').doc(`bob_group1_${today}`).set({
        userId: 'bob',
        groupId: 'group1',
        rating: 3,
        date: today,
        createdAt: Timestamp.now(),
      });

      // Then try to update another user's rating - should fail because updates are not allowed
      await assertFails(
        aliceContext.firestore().collection('ratings').doc(`bob_group1_${today}`).update({
          rating: 1,
          updatedAt: Timestamp.now(),
        })
      );
    });

    test('should allow group moderator to delete any rating', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group members
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.MODERATOR,
        joinedAt: Timestamp.now(),
      });

      await bobContext.firestore().collection('groupMembers').doc('bob_group1').set({
        groupId: 'group1',
        userId: 'bob',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Create ratings
      const today = new Date().toISOString().split('T')[0];
      await bobContext.firestore().collection('ratings').doc(`bob_group1_${today}`).set({
        userId: 'bob',
        groupId: 'group1',
        rating: 3,
        date: today,
        createdAt: Timestamp.now(),
      });

      // Then delete the rating
      await assertSucceeds(
        aliceContext.firestore().collection('ratings').doc(`bob_group1_${today}`).delete()
      );
    });

    test('should prevent user from deleting their own rating', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Create a rating
      const today = new Date().toISOString().split('T')[0];
      await aliceContext.firestore().collection('ratings').doc(`alice_group1_${today}`).set({
        userId: 'alice',
        groupId: 'group1',
        rating: 4,
        date: today,
        createdAt: Timestamp.now(),
      });

      // Then try to delete the rating - should fail because users can't delete their own ratings
      await assertFails(
        aliceContext.firestore().collection('ratings').doc(`alice_group1_${today}`).delete()
      );
    });

    test('should prevent user from deleting their own rating from a different day', async () => {
      // First create a group
      await aliceContext
        .firestore()
        .collection('groups')
        .doc('group1')
        .set({
          ...testGroup,
          createdAt: Timestamp.now(),
          createdBy: 'alice',
        });

      // Create group member
      await aliceContext.firestore().collection('groupMembers').doc('alice_group1').set({
        groupId: 'group1',
        userId: 'alice',
        role: GroupMemberRole.MEMBER,
        joinedAt: Timestamp.now(),
      });

      // Create a rating for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await aliceContext.firestore().collection('ratings').doc(`alice_group1_${yesterdayStr}`).set({
        userId: 'alice',
        groupId: 'group1',
        rating: 4,
        date: yesterdayStr,
        createdAt: Timestamp.now(),
      });

      // Then try to delete the rating
      await assertFails(
        aliceContext.firestore().collection('ratings').doc(`alice_group1_${yesterdayStr}`).delete()
      );
    });
  });
});
