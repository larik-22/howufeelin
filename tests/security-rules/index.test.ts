/**
 * Main test file for Firestore security rules
 *
 * This file imports and runs all collection-specific test files.
 * As you add more collection tests, import them here.
 */

// Import users collection tests
import './users/users.test';
import './groups/groups.test';
import './ratings/ratings.test';

// Import other collection tests as they are created
// import './ratings/ratings.test';
