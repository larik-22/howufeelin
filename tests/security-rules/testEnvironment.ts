import * as fs from 'fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
  RulesTestContext,
} from '@firebase/rules-unit-testing';

/**
 * Test environment for security rules testing
 */
export class SecurityRulesTestEnvironment {
  private testEnv: RulesTestEnvironment | null = null;
  private contexts: Map<string, RulesTestContext> = new Map();

  /**
   * Initialize the test environment
   */
  async initialize(): Promise<void> {
    this.testEnv = await initializeTestEnvironment({
      projectId: 'demo-' + Date.now(),
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  }

  /**
   * Clean up the test environment
   */
  async cleanup(): Promise<void> {
    if (this.testEnv) {
      await this.testEnv.cleanup();
      this.testEnv = null;
      this.contexts.clear();
    }
  }

  /**
   * Clear Firestore data
   */
  async clearFirestore(): Promise<void> {
    if (this.testEnv) {
      await this.testEnv.clearFirestore();
    }
  }

  /**
   * Get a test context for an authenticated user
   * @param uid - User ID
   * @param authData - Additional auth data
   * @returns A test context for the authenticated user
   */
  getAuthenticatedContext(uid: string, authData: Record<string, unknown> = {}): RulesTestContext {
    if (!this.testEnv) {
      throw new Error('Test environment not initialized');
    }

    const contextKey = `auth_${uid}`;
    if (!this.contexts.has(contextKey)) {
      this.contexts.set(
        contextKey,
        this.testEnv.authenticatedContext(uid, { auth: { uid, ...authData } })
      );
    }

    return this.contexts.get(contextKey)!;
  }

  /**
   * Get a test context for an unauthenticated user
   * @returns A test context for the unauthenticated user
   */
  getUnauthenticatedContext(): RulesTestContext {
    if (!this.testEnv) {
      throw new Error('Test environment not initialized');
    }

    const contextKey = 'unauth';
    if (!this.contexts.has(contextKey)) {
      this.contexts.set(contextKey, this.testEnv.unauthenticatedContext());
    }

    return this.contexts.get(contextKey)!;
  }

  /**
   * Assert that an operation succeeds
   * @param operation - The operation to test
   */
  async assertSucceeds(operation: Promise<unknown>): Promise<void> {
    await assertSucceeds(operation);
  }

  /**
   * Assert that an operation fails
   * @param operation - The operation to test
   */
  async assertFails(operation: Promise<unknown>): Promise<void> {
    await assertFails(operation);
  }
}

// Export a singleton instance
export const securityRulesTestEnv = new SecurityRulesTestEnvironment();
