// src/modules/payments/domain/value-objects/retry-policy.vo.ts

export type BackoffStrategy = 'FIXED' | 'EXPONENTIAL' | 'LINEAR';

export class RetryPolicyVO {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly strategy: BackoffStrategy;

  // 🛑 HARD SAFETY LIMITS
  private readonly MAX_BACKOFF_MS = 120000; // 2 minutes cap

  constructor(params?: {
    maxAttempts?: number;
    baseDelayMs?: number;
    strategy?: BackoffStrategy;
  }) {
    // 🧠 SAFE DEFAULTS (VERY IMPORTANT FOR PAYMENTS)
    this.maxAttempts = params?.maxAttempts ?? 5;
    this.baseDelayMs = params?.baseDelayMs ?? 5000;
    this.strategy = params?.strategy ?? 'EXPONENTIAL';

    this.validate();
  }

  /**
   * Validate retry policy safety constraints
   */
  private validate() {
    if (this.maxAttempts < 1 || this.maxAttempts > 10) {
      throw new Error('maxAttempts must be between 1 and 10');
    }

    if (this.baseDelayMs < 100) {
      throw new Error('baseDelayMs must be at least 100ms');
    }
  }

  /**
   * Calculate safe retry delay
   */
  getDelay(attempt: number): number {
    let delay: number;

    switch (this.strategy) {
      case 'FIXED':
        delay = this.baseDelayMs;
        break;

      case 'LINEAR':
        delay = this.baseDelayMs * attempt;
        break;

      case 'EXPONENTIAL':
        delay = this.baseDelayMs * Math.pow(2, attempt - 1);
        break;

      default:
        delay = this.baseDelayMs;
    }

    // 🛑 HARD CEILING (CRITICAL SAFETY)
    return Math.min(delay, this.MAX_BACKOFF_MS);
  }

  /**
   * Safe retry check (explicit attempt model)
   *
   * Assumption:
   * attempt starts at 1 (NOT 0)
   */
  canRetry(attempt: number): boolean {
    if (attempt < 1) return true;
    return attempt < this.maxAttempts;
  }

  /**
   * Utility: next attempt number
   */
  nextAttempt(current: number): number {
    return current + 1;
  }
}