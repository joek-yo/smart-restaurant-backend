// src/modules/checkout/application/services/checkout-lock.service.ts

/**
 * CheckoutLockService
 * -------------------
 * Prevents race conditions and double checkout execution
 */

export class CheckoutLockService {

  private locks = new Map<string, boolean>();

  acquire(sessionId: string): boolean {
    if (this.locks.get(sessionId)) {
      return false;
    }

    this.locks.set(sessionId, true);
    return true;
  }

  release(sessionId: string): void {
    this.locks.delete(sessionId);
  }

  isLocked(sessionId: string): boolean {
    return this.locks.get(sessionId) === true;
  }
}