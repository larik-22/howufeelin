import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  CACHE_SIZE_UNLIMITED,
} from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Analytics with debug mode support
let analytics: Analytics | null = null;
const initAnalytics = async () => {
  try {
    // Check if analytics is supported in the current environment
    const analyticsSupported = await isSupported();
    const enableLocalAnalytics = import.meta.env.VITE_ENABLE_LOCAL_ANALYTICS === 'true';

    if (analyticsSupported || enableLocalAnalytics) {
      analytics = getAnalytics(app);
      if (debugMode) {
        console.log('Firebase Analytics initialized successfully');
        if (enableLocalAnalytics) {
          console.log('Local analytics debugging is enabled');
        }
      }
    } else {
      console.warn('Firebase Analytics is not supported in this environment');
    }
  } catch (error) {
    console.error('Error initializing Firebase Analytics:', error);
  }
};

// Initialize analytics
initAnalytics();

// Export analytics instance
export { analytics };

// Initialize Firestore with persistent local cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  }),
});

// Helper function to parse host and port from environment variable
const parseHostPort = (hostPort: string): [string, number] => {
  const [host, port] = hostPort.split(':');
  return [host, parseInt(port, 10)];
};

// Connect to emulators if enabled in environment
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
const debugMode = import.meta.env.VITE_FIREBASE_EMULATOR_DEBUG === 'true';
if (useEmulator) {
  try {
    // Connect to Auth emulator
    const [authHost, authPort] = parseHostPort(import.meta.env.VITE_AUTH_EMULATOR_HOST);
    connectAuthEmulator(auth, `http://${authHost}:${authPort}`);

    // Connect to Firestore emulator
    const [firestoreHost, firestorePort] = parseHostPort(
      import.meta.env.VITE_FIRESTORE_EMULATOR_HOST
    );
    connectFirestoreEmulator(db, firestoreHost, firestorePort);

    if (debugMode) {
      console.log('Connected to Firebase emulators:');
      console.log(`- Auth: ${authHost}:${authPort}`);
      console.log(`- Firestore: ${firestoreHost}:${firestorePort}`);
      console.log(
        `- Emulator UI: http://localhost:${import.meta.env.VITE_FIREBASE_EMULATOR_UI_PORT}`
      );
      console.log('Firestore persistence enabled via localCache configuration');
    }
  } catch (error) {
    console.error('Error connecting to Firebase emulators:', error);
  }
}

// Log initialization status
if (debugMode) {
  console.log(`Firebase initialized${useEmulator ? ' with emulators' : ' in production mode'}`);
}
