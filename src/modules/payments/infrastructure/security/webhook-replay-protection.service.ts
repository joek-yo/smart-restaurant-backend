// src/modules/payments/infrastructure/security/webhook-replay-protection.service.ts

import {
  Injectable,
  ConflictException,
  Logger,
} from '@nestjs/common';

import * as crypto from 'crypto';

/**
 * WebhookReplayProtectionService
 * --------------------------------------------------
 * PURPOSE:
 * Prevent duplicate/replayed MPESA callbacks from being
 * processed multiple times.
 *
 * SECURITY GOALS:
 * - Prevent replay attacks
 * - Prevent duplicate callback execution
 * - Protect order/payment consistency
 * - Avoid double-confirmation bugs
 *
 * PRODUCTION NOTES:
 * - Replace in-memory storage with Redis SETNX
 * - Persist fingerprints across app restarts
 * - Use shared distributed cache for multi-instance deployments
 */

@Injectable()
export class WebhookReplayProtectionService {
  private readonly logger = new Logger(
    WebhookReplayProtectionService.name,
  );

  /**
   * DEV-ONLY MEMORY STORE
   * --------------------------------
   * key   = fingerprint
   * value = timestamp
   */
  private readonly processedFingerprints = new Map<string, number>();

  /**
   * Replay window
   * --------------------------------
   * Same webhook within this period
   * is considered a replay.
   */
  private readonly REPLAY_WINDOW_MS =
    Number(process.env.MPESA_REPLAY_WINDOW_MS) ||
    5 * 60 * 1000; // 5 mins

  /**
   * Maximum memory entries before aggressive cleanup
   */
  private readonly MAX_CACHE_SIZE = 10000;

  // =====================================================
  // 🔐 MAIN ENTRY POINT
  // =====================================================

  /**
   * Validates webhook has NOT been processed before
   */
  validateNoReplay(payload: any): void {
    if (!payload) {
      throw new ConflictException(
        'Cannot validate replay for empty payload',
      );
    }

    const fingerprint = this.generateFingerprint(payload);
    const now = Date.now();

    this.cleanupExpiredEntries(now);

    const existingTimestamp =
      this.processedFingerprints.get(fingerprint);

    // =====================================================
    // 🚫 REPLAY DETECTED
    // =====================================================
    if (existingTimestamp) {
      const ageMs = now - existingTimestamp;

      this.logger.warn(
        `[WEBHOOK_REPLAY_BLOCKED] fingerprint=${fingerprint} ageMs=${ageMs}`,
      );

      throw new ConflictException(
        'Duplicate webhook detected (replay blocked)',
      );
    }

    // =====================================================
    // ✅ STORE NEW FINGERPRINT
    // =====================================================
    this.processedFingerprints.set(fingerprint, now);

    this.logger.log(
      `[WEBHOOK_REPLAY_ACCEPTED] fingerprint=${fingerprint}`,
    );

    // Emergency cleanup protection
    if (this.processedFingerprints.size > this.MAX_CACHE_SIZE) {
      this.logger.warn(
        `[WEBHOOK_REPLAY_CACHE_LIMIT] size=${this.processedFingerprints.size}`,
      );

      this.cleanupExpiredEntries(now, true);
    }
  }

  // =====================================================
  // 🔑 FINGERPRINT GENERATION
  // =====================================================

  /**
   * Generates deterministic fingerprint
   * for MPESA webhook payload.
   *
   * IMPORTANT:
   * Fingerprint MUST remain stable for
   * identical callbacks.
   */
  generateFingerprint(payload: any): string {
    const callback =
      payload?.Body?.stkCallback ||
      payload?.stkCallback ||
      payload;

    const metadata = callback?.CallbackMetadata?.Item || [];

    const getMetadataValue = (name: string) =>
      metadata.find((x: any) => x.Name === name)?.Value;

    /**
     * Stable identity fields
     */
    const fingerprintPayload = {
      checkoutRequestId:
        callback?.CheckoutRequestID || '',

      merchantRequestId:
        callback?.MerchantRequestID || '',

      mpesaReceiptNumber:
        getMetadataValue('MpesaReceiptNumber') || '',

      phoneNumber:
        getMetadataValue('PhoneNumber') || '',

      amount:
        getMetadataValue('Amount') || '',

      resultCode:
        callback?.ResultCode ?? '',

      resultDesc:
        callback?.ResultDesc || '',
    };

    const normalized = JSON.stringify(
      this.sortObjectKeys(fingerprintPayload),
    );

    return crypto
      .createHash('sha256')
      .update(normalized)
      .digest('hex');
  }

  // =====================================================
  // 🧹 CLEANUP EXPIRED ENTRIES
  // =====================================================

  /**
   * Removes expired replay fingerprints
   */
  private cleanupExpiredEntries(
    now: number,
    aggressive = false,
  ): void {
    for (const [fingerprint, timestamp] of this
      .processedFingerprints.entries()) {
      const expired =
        now - timestamp > this.REPLAY_WINDOW_MS;

      /**
       * Aggressive mode:
       * remove oldest entries faster if cache grows large
       */
      const aggressivelyExpired =
        aggressive &&
        now - timestamp >
          this.REPLAY_WINDOW_MS / 2;

      if (expired || aggressivelyExpired) {
        this.processedFingerprints.delete(fingerprint);
      }
    }
  }

  // =====================================================
  // 🔄 DETERMINISTIC SORTING
  // =====================================================

  /**
   * Ensures stable JSON hashing
   * independent of object key order.
   */
  private sortObjectKeys(obj: Record<string, any>) {
    return Object.keys(obj)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = obj[key];
          return acc;
        },
        {} as Record<string, any>,
      );
  }
}