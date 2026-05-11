// src/modules/checkout/application/services/checkout-lock.service.ts

/**
 * CheckoutLockService
 * -------------------
 * Prevents race conditions and double checkout execution.
 *
 * ⚠️ IMPORTANT:
 * This is an in-memory lock implementation.
 * It is NOT safe for multi-instance deployments.
 *
 * Future upgrade:
 * - Replace with Redis lock (SET NX PX)
 * - Or distributed lock service
 */

export class CheckoutLockService {
  private locks = new Map<string, boolean>();

  /**
   * Acquire lock for a session
   * Returns false if already locked
   */
  acquire(sessionId: string): boolean {
    if (this.locks.get(sessionId)) {
      return false;
    }

    this.locks.set(sessionId, true);
    return true;
  }

  /**
   * Release lock for session
   */
  release(sessionId: string): void {
    this.locks.delete(sessionId);
  }

  /**
   * Check lock state
   */
  isLocked(sessionId: string): boolean {
    return this.locks.get(sessionId) === true;
  }
}