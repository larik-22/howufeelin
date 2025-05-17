import { getAuth, signInAnonymously } from 'firebase/auth';
import { userService } from './userService';
import { groupService } from './groupService';
import { ratingService } from './ratingService';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Keep track of whether we've already seeded data
let hasSeededData = false;

// Sample comments for ratings
const RATING_COMMENTS = {
  positive: [
    'Feeling great today! Had a productive morning and looking forward to the rest of the day.',
    'Team meeting went really well, lots of good ideas shared.',
    'Making good progress on the project, feeling motivated.',
    'Had a great workout this morning, feeling energized.',
    'Finished a challenging task, feeling accomplished.',
  ],
  neutral: [
    'Day is going okay, nothing special but nothing bad either.',
    'Regular day at work, getting things done.',
    'Feeling a bit tired but pushing through.',
    'Need to take a break soon, been working for a while.',
    "Weather is nice today, that's a plus.",
  ],
  negative: [
    'Feeling a bit under the weather today.',
    'Had a rough start to the day, hope it gets better.',
    'Feeling a bit overwhelmed with the workload.',
    'Need to take it easy today, not feeling 100%.',
    'Had some technical issues that were frustrating.',
  ],
};

export const devDataService = {
  async seedTestData() {
    try {
      // Check if we've already seeded data
      if (hasSeededData) {
        console.log('Test data already seeded, skipping...');
        return;
      }

      // First, authenticate anonymously
      const auth = getAuth();
      const userCredential = await signInAnonymously(auth);
      const firebaseUser = userCredential.user;

      // Create the test user profile
      const testUser = await userService.createInitialUser({
        uid: firebaseUser.uid,
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
      });

      // Create test group using the groupService
      const group = await groupService.createGroup(
        'Development Team',
        'A group for testing and development purposes',
        testUser
      );

      // Add ratings for today and yesterday
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Format date as YYYY-MM-DD
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      // Create today's rating using the service (with validation)
      const todayRating = Math.floor(Math.random() * 5) + 1;
      const todayComment =
        todayRating >= 4
          ? RATING_COMMENTS.positive[Math.floor(Math.random() * RATING_COMMENTS.positive.length)]
          : todayRating >= 3
          ? RATING_COMMENTS.neutral[Math.floor(Math.random() * RATING_COMMENTS.neutral.length)]
          : RATING_COMMENTS.negative[Math.floor(Math.random() * RATING_COMMENTS.negative.length)];

      await ratingService.createRating(group.groupId, testUser.userId, todayRating, todayComment);

      // Create yesterday's rating directly in Firestore (bypassing validation)
      const yesterdayRating = Math.floor(Math.random() * 5) + 1;
      const yesterdayComment =
        yesterdayRating >= 4
          ? RATING_COMMENTS.positive[Math.floor(Math.random() * RATING_COMMENTS.positive.length)]
          : yesterdayRating >= 3
          ? RATING_COMMENTS.neutral[Math.floor(Math.random() * RATING_COMMENTS.neutral.length)]
          : RATING_COMMENTS.negative[Math.floor(Math.random() * RATING_COMMENTS.negative.length)];

      const yesterdayDate = formatDate(yesterday);
      const ratingId = `${group.groupId}_${yesterdayDate}_${testUser.userId}`;
      const now = Timestamp.now();

      await setDoc(doc(db, 'ratings', ratingId), {
        ratingId,
        groupId: group.groupId,
        userId: testUser.userId,
        ratingDate: yesterdayDate,
        ratingNumber: yesterdayRating,
        notes: yesterdayComment,
        createdAt: now,
        updatedAt: now,
      });

      // Mark that we've seeded the data
      hasSeededData = true;
      console.log('Test data seeded successfully');
      return testUser;
    } catch (error) {
      console.error('Error seeding test data:', error);
      throw error;
    }
  },

  // Method to reset the seeded state (useful for testing)
  resetSeededState() {
    hasSeededData = false;
  },
};
