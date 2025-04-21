# Firestore Security Rules Tests

This directory contains tests for the Firestore security rules. The tests are organized by collection to make them more maintainable and easier to understand.

## Directory Structure

```
tests/security-rules/
├── README.md                 # This file
├── index.test.ts             # Main test file that imports all collection tests
├── testEnvironment.ts        # Test environment setup and utilities
├── testHelpers.ts            # Helper functions for creating test data
└── users/                    # Tests for the users collection
    └── users.test.ts         # Tests for user document operations
```

## Running the Tests

To run the security rules tests, use the following command:

```bash
npm run test:rules
```

This will start the Firebase emulators and run the tests against them.

## Adding New Collection Tests

To add tests for a new collection:

1. Create a new directory for the collection tests (e.g., `groups/`)
2. Create a test file for the collection (e.g., `groups.test.ts`)
3. Import the test file in `index.test.ts`

## Test Structure

Each collection test file follows this structure:

1. **Setup**: Initialize the test environment and clear Firestore data
2. **Read Operations**: Test read permissions
3. **Create Operations**: Test create permissions and data validation
4. **Update Operations**: Test update permissions and data validation
5. **Delete Operations**: Test delete permissions

## Best Practices

- Use the helper functions in `testHelpers.ts` to create test data
- Use the test environment in `testEnvironment.ts` to manage test contexts
- Test both positive and negative cases (what should succeed and what should fail)
- Test edge cases and boundary conditions
- Keep tests focused and isolated
- Use descriptive test names that explain what is being tested
