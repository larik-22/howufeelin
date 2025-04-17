import { db } from '@/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';

/**
 * This script directly adds test ratings to the database.
 * It bypasses the normal rating service restrictions.
 * For testing purposes only.
 */
export async function addTestRatingsDirectly() {
  try {
    console.log('Adding test ratings directly to the database...');

    // Specific group and users for testing
    const groupId = 'VotkgKH1m7wIvYMgZq86';
    const userId1 = '8BgAEKZAHhT6h0dgexZSH28esLm2';
    const userId2 = 'knPHknFYY2gTDzqFXfjWHE6DRnv2';

    // Create a rating for yesterday
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const now = Timestamp.now();

    // Create rating for user 1 (yesterday)
    const ratingId1 = `${groupId}_${yesterday}_${userId1}_test1`;
    await setDoc(doc(db, 'ratings', ratingId1), {
      ratingId: ratingId1,
      groupId,
      userId: userId1,
      ratingDate: yesterday,
      ratingNumber: 8,
      notes: 'Test rating for yesterday - User 1',
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Added rating for ${yesterday} - User 1`);

    // Create rating for user 2 (yesterday)
    const ratingId2 = `${groupId}_${yesterday}_${userId2}_test1`;
    await setDoc(doc(db, 'ratings', ratingId2), {
      ratingId: ratingId2,
      groupId,
      userId: userId2,
      ratingDate: yesterday,
      ratingNumber: 7,
      notes: 'Test rating for yesterday - User 2',
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Added rating for ${yesterday} - User 2`);

    console.log('Test ratings added successfully!');
  } catch (error) {
    console.error('Error adding test ratings:', error);
  }
}
