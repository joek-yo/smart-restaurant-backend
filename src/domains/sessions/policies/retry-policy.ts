// 📁 src/domains/sessions/policies/retry-policy.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class RetryPolicy {
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY_MS = 500; // base delay for exponential backoff

  /**
   * Determines if an operation can be retried
   */
  canRetry(retryCount: number): boolean {
    return retryCount < this.MAX_RETRIES;
  }

  /**
   * Calculates delay using exponential backoff
   */
  getDelay(retryCount: number): number {
    return this.BASE_DELAY_MS * Math.pow(2, retryCount);
  }

  /**
   * Execute a retryable async operation
   */
  async execute<T>(
    operation: () => Promise<T>,
    retryCount = 0,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (!this.canRetry(retryCount)) {
        throw error;
      }

      const delay = this.getDelay(retryCount);
      await this.sleep(delay);

      return this.execute(operation, retryCount + 1);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}