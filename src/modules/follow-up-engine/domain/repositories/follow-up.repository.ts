// FILE: src/modules/follow-up-engine/domain/repositories/follow-up.repository.ts

import { FollowUpJobEntity } from '../entities/follow-up-job.entity';

import { FollowUpType } from '../enums/follow-up-type.enum';

/**
 * FindPendingFollowUpsInput
 * -------------------------------------------------------
 * Query contract for retrieving pending jobs.
 */
export interface FindPendingFollowUpsInput {
  limit?: number;

  tenantId?: string;

  userId?: string;

  type?: FollowUpType;
}

/**
 * FindScheduledBeforeInput
 * -------------------------------------------------------
 * Query contract for retrieving due jobs.
 */
export interface FindScheduledBeforeInput {
  before: Date;

  limit?: number;
}

/**
 * ExistsActiveFollowUpInput
 * -------------------------------------------------------
 * Duplicate-prevention contract.
 */
export interface ExistsActiveFollowUpInput {
  tenantId: string;

  userId: string;

  type: FollowUpType;
}

/**
 * CancelFollowUpInput
 * -------------------------------------------------------
 * Cancellation contract.
 */
export interface CancelFollowUpInput {
  followUpId: string;

  reason?: string;
}

/**
 * FollowUpRepository
 * -------------------------------------------------------
 * Domain persistence contract for follow-up jobs.
 *
 * Responsibilities:
 * - persistence abstraction
 * - retrieval abstraction
 * - duplicate prevention abstraction
 * - lifecycle persistence
 *
 * IMPORTANT:
 * - NO Redis logic
 * - NO BullMQ logic
 * - NO infrastructure logic
 *
 * Infrastructure implementations MUST implement this contract.
 */

export abstract class FollowUpRepository {
  // ==================================================
  // 🏗️ CREATE FOLLOW-UP
  // ==================================================

  abstract create(
    job: FollowUpJobEntity,
  ): Promise<FollowUpJobEntity>;

  // ==================================================
  // ♻️ UPDATE FOLLOW-UP
  // ==================================================

  abstract update(
    job: FollowUpJobEntity,
  ): Promise<FollowUpJobEntity>;

  // ==================================================
  // ⏳ FIND PENDING FOLLOW-UPS
  // ==================================================

  abstract findPending(
    input?: FindPendingFollowUpsInput,
  ): Promise<FollowUpJobEntity[]>;

  // ==================================================
  // 🚫 CANCEL FOLLOW-UP
  // ==================================================

  abstract cancel(
    input: CancelFollowUpInput,
  ): Promise<void>;

  // ==================================================
  // 👤 FIND USER FOLLOW-UPS
  // ==================================================

  abstract findByUser(
    tenantId: string,
    userId: string,
  ): Promise<FollowUpJobEntity[]>;

  // ==================================================
  // ⏱️ FIND SCHEDULED JOBS BEFORE DATE
  // ==================================================

  abstract findScheduledBefore(
    input: FindScheduledBeforeInput,
  ): Promise<FollowUpJobEntity[]>;

  // ==================================================
  // 🔁 DUPLICATE PREVENTION
  // ==================================================

  abstract existsActiveFollowUp(
    input: ExistsActiveFollowUpInput,
  ): Promise<boolean>;

  // ==================================================
  // 🔎 FIND BY ID
  // ==================================================

  abstract findById(
    id: string,
  ): Promise<FollowUpJobEntity | null>;
}