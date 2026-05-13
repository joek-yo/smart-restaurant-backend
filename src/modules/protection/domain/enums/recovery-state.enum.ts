// src/modules/protection/domain/enums/recovery-state.enum.ts

/**
 * RecoveryState
 * -------------
 * Represents the execution state of a recovery operation itself.
 *
 * IMPORTANT:
 * This is NOT the business workflow state.
 * This is the recovery process lifecycle.
 */
export enum RecoveryState {
  /**
   * PENDING
   * -------
   * Recovery has been triggered but not started yet.
   * Usually sitting in queue or scheduler.
   */
  PENDING = 'PENDING',

  /**
   * RUNNING
   * -------
   * Recovery is actively being executed.
   * May involve state restoration, session rebuild, or retry logic.
   */
  RUNNING = 'RUNNING',

  /**
   * FAILED
   * ------
   * Recovery attempt failed.
   * May trigger retry, escalation, or dead-letter handling.
   */
  FAILED = 'FAILED',

  /**
   * COMPLETED
   * ---------
   * Recovery successfully restored workflow to a stable state.
   */
  COMPLETED = 'COMPLETED',
}