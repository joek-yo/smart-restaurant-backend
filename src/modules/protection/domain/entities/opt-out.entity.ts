// FILE: src/modules/protection/domain/entities/opt-out.entity.ts

/**
 * OptOutEntity
 * ---------------------------------------------------------
 * Domain entity representing a user's global messaging suppression state.
 *
 * Once a user opts out (STOP / UNSUBSCRIBE / BLOCK):
 * - they must NOT receive any outbound messages
 * - they must be excluded from queues, schedulers, and workflows
 *
 * This is a HARD SYSTEM GUARANTEE, not a soft preference.
 */

export type OptOutReason =
  | 'STOP'
  | 'UNSUBSCRIBE'
  | 'USER_REQUEST'
  | 'SPAM_REPORT'
  | 'MANUAL_ADMIN'
  | 'SYSTEM_DETECTION';

export class OptOutEntity {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly isOptedOut: boolean,
    public readonly reason: OptOutReason,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  // ==================================================
  // 🧠 DOMAIN BEHAVIOR
  // ==================================================

  static create(params: {
    tenantId: string;
    userId: string;
    reason: OptOutReason;
  }): OptOutEntity {
    const now = new Date();

    return new OptOutEntity(
      params.tenantId,
      params.userId,
      true,
      params.reason,
      now,
      now,
    );
  }

  static reactivate(params: {
    tenantId: string;
    userId: string;
  }): OptOutEntity {
    const now = new Date();

    return new OptOutEntity(
      params.tenantId,
      params.userId,
      false,
      'USER_REQUEST',
      now,
      now,
    );
  }

  // ==================================================
  // 🔐 RULES
  // ==================================================

  canReceiveMessages(): boolean {
    return this.isOptedOut === false;
  }

  isBlocked(): boolean {
    return this.isOptedOut === true;
  }
}