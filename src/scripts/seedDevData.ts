import { devDataService } from '@/services/devDataService';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Keep track of whether we've started the seeding process
let isSeedingStarted = false;

async function seedDevData() {
  // Prevent multiple seeding attempts
  if (isSeedingStarted) {
    console.log('Seeding already in progress, skipping...');
    return;
  }

  isSeedingStarted = true;

  try {
    const auth = getAuth();

    // Wait for auth to be ready
    await new Promise<void>(resolve => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe();
        resolve();
      });
    });

    // Seed the data
    //await devDataService.seedTestData();
    console.log('Development data seeded successfully');
  } catch (error) {
    console.error('Failed to seed development data:', error);
  } finally {
    isSeedingStarted = false;
  }
}

// Only run in development environment
if (import.meta.env.DEV) {
  // Wait for Firebase to initialize
  setTimeout(() => {
    seedDevData();
  }, 1000);

  // Handle HMR
  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      console.log('HMR detected, skipping data seeding...');
    });
  }
}
