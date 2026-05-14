// FILE: src/modules/follow-up-engine/domain/entities/follow-up-job.entity.ts

import { randomUUID } from 'crypto';

import { FollowUpType } from '../enums/follow-up-type.enum';

import { FollowUpScheduleVO } from '../value-objects/follow-up-schedule.vo';
import { FollowUpTriggerVO } from '../value-objects/follow-up-trigger.vo';

/**
 * FollowUpJobStatus
 * -------------------------------------------------------
 * Internal lifecycle states for follow-up jobs.
 */
export type FollowUpJobStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

/**
 * FollowUpChannel
 * -------------------------------------------------------
 * Supported delivery channels.
 */
export type FollowUpChannel =
  | 'whatsapp'
  | 'sms'
  | 'email';

/**
 * FollowUpJobProps
 * -------------------------------------------------------
 * Aggregate creation contract.
 */
export interface FollowUpJobProps {
  id?: string;

  tenantId: string;

  userId: string;

  type: FollowUpType;

  status?: FollowUpJobStatus;

  channel: FollowUpChannel;

  schedule: FollowUpScheduleVO;

  trigger: FollowUpTriggerVO;

  payload?: Record<string, any>;

  retryCount?: number;

  maxRetries?: number;

  createdAt?: Date;

  updatedAt?: Date;

  cancelledAt?: Date;

  completedAt?: Date;

  failedAt?: Date;
}

/**
 * FollowUpJobEntity
 * -------------------------------------------------------
 * Core aggregate/entity for follow-up execution.
 *
 * Responsibilities:
 * - represents follow-up lifecycle
 * - scheduling ownership
 * - retry ownership
 * - cancellation state
 * - completion tracking
 * - auditability
 *
 * IMPORTANT:
 * This entity contains NO queue logic.
 * This entity contains NO transport logic.
 */

export class FollowUpJobEntity {
  readonly id: string;

  readonly tenantId: string;

  readonly userId: string;

  readonly type: FollowUpType;

  readonly channel: FollowUpChannel;

  readonly trigger: FollowUpTriggerVO;

  readonly schedule: FollowUpScheduleVO;

  payload: Record<string, any>;

  status: FollowUpJobStatus;

  retryCount: number;

  readonly maxRetries: number;

  readonly createdAt: Date;

  updatedAt: Date;

  cancelledAt?: Date;

  completedAt?: Date;

  failedAt?: Date;

  constructor(props: FollowUpJobProps) {
    this.validate(props);

    this.id = props.id ?? randomUUID();

    this.tenantId = props.tenantId;

    this.userId = props.userId;

    this.type = props.type;

    this.channel = props.channel;

    this.trigger = props.trigger;

    this.schedule = props.schedule;

    this.payload = props.payload ?? {};

    this.status =
      props.status ?? 'PENDING';

    this.retryCount =
      props.retryCount ?? 0;

    this.maxRetries =
      props.maxRetries ?? 3;

    this.createdAt =
      props.createdAt ?? new Date();

    this.updatedAt =
      props.updatedAt ?? new Date();

    this.cancelledAt =
      props.cancelledAt;

    this.completedAt =
      props.completedAt;

    this.failedAt =
      props.failedAt;
  }

  // ==================================================
  // 🚀 MARK SCHEDULED
  // ==================================================

  markScheduled() {
    this.status = 'SCHEDULED';

    this.touch();
  }

  // ==================================================
  // ⚙️ MARK PROCESSING
  // ==================================================

  markProcessing() {
    this.status = 'PROCESSING';

    this.touch();
  }

  // ==================================================
  // ✅ MARK COMPLETED
  // ==================================================

  markCompleted() {
    this.status = 'COMPLETED';

    this.completedAt = new Date();

    this.touch();
  }

  // ==================================================
  // ❌ MARK FAILED
  // ==================================================

  markFailed() {
    this.status = 'FAILED';

    this.failedAt = new Date();

    this.retryCount += 1;

    this.touch();
  }

  // ==================================================
  // 🚫 CANCEL JOB
  // ==================================================

  cancel(reason?: string) {
    this.status = 'CANCELLED';

    this.cancelledAt = new Date();

    if (reason) {
      this.payload = {
        ...this.payload,
        cancellationReason: reason,
      };
    }

    this.touch();
  }

  // ==================================================
  // ⌛ MARK EXPIRED
  // ==================================================

  markExpired() {
    this.status = 'EXPIRED';

    this.touch();
  }

  // ==================================================
  // 🔁 RETRY CHECK
  // ==================================================

  canRetry(): boolean {
    return (
      this.retryCount <
      this.maxRetries
    );
  }

  // ==================================================
  // ⏱️ EXECUTION READINESS
  // ==================================================

  isReady(): boolean {
    return this.schedule.isReady();
  }

  // ==================================================
  // 🚫 TERMINAL STATE CHECK
  // ==================================================

  isTerminal(): boolean {
    return [
      'COMPLETED',
      'CANCELLED',
      'EXPIRED',
    ].includes(this.status);
  }

  // ==================================================
  // 📦 SERIALIZATION
  // ==================================================

  toJSON() {
    return {
      id: this.id,

      tenantId: this.tenantId,

      userId: this.userId,

      type: this.type,

      status: this.status,

      channel: this.channel,

      payload: this.payload,

      retryCount: this.retryCount,

      maxRetries: this.maxRetries,

      trigger: this.trigger.toJSON(),

      schedule: this.schedule.toJSON(),

      createdAt:
        this.createdAt.toISOString(),

      updatedAt:
        this.updatedAt.toISOString(),

      cancelledAt:
        this.cancelledAt?.toISOString(),

      completedAt:
        this.completedAt?.toISOString(),

      failedAt:
        this.failedAt?.toISOString(),
    };
  }

  // ==================================================
  // 🛠️ INTERNAL TIMESTAMP UPDATE
  // ==================================================

  private touch() {
    this.updatedAt = new Date();
  }

  // ==================================================
  // 🛡️ VALIDATION
  // ==================================================

  private validate(
    props: FollowUpJobProps,
  ) {
    if (!props.tenantId?.trim()) {
      throw new Error(
        'tenantId is required',
      );
    }

    if (!props.userId?.trim()) {
      throw new Error(
        'userId is required',
      );
    }

    if (!props.type) {
      throw new Error(
        'follow-up type is required',
      );
    }

    if (!props.channel) {
      throw new Error(
        'follow-up channel is required',
      );
    }

    if (!props.schedule) {
      throw new Error(
        'follow-up schedule is required',
      );
    }

    if (!props.trigger) {
      throw new Error(
        'follow-up trigger is required',
      );
    }
  }
}