// src/modules/payments/domain/entities/reconciliation-logger.entity.ts

/**
 * Reconciliation Logger Entity
 * --------------------------------
 * Purpose:
 * Stores every reconciliation run result as immutable audit history.
 *
 * Why this exists:
 * - Proves what the system saw at a given time
 * - Tracks corrections applied to payments/ledger
 * - Enables forensic financial debugging
 * - Supports compliance & audit requirements
 */

export type ReconciliationRunType = 'HOURLY' | 'DAILY' | 'MANUAL';

export interface ReconciliationCorrection {
  paymentId: string;
  issue: string;
  actionTaken: 'FIXED' | 'IGNORED' | 'FLAGGED';
  beforeState: string;
  afterState: string;
}

export class ReconciliationLoggerEntity {
  id: string;

  /**
   * Type of reconciliation run
   */
  runType: ReconciliationRunType;

  /**
   * Time range evaluated
   */
  fromDate: Date;
  toDate: Date;

  /**
   * Summary stats
   */
  matched: number;
  mismatched: number;
  fixed: number;

  /**
   * Detailed corrections applied
   */
  corrections: ReconciliationCorrection[];

  /**
   * System metadata
   */
  createdAt: Date;

  constructor(partial: Partial<ReconciliationLoggerEntity>) {
    Object.assign(this, partial);

    this.createdAt = this.createdAt ?? new Date();
    this.corrections = this.corrections ?? [];
  }

  /**
   * Add a correction record
   */
  addCorrection(correction: ReconciliationCorrection) {
    this.corrections.push(correction);
    this.mismatched += 1;

    if (correction.actionTaken === 'FIXED') {
      this.fixed += 1;
    }
  }

  /**
   * Mark a successful match
   */
  markMatched() {
    this.matched += 1;
  }

  /**
   * Final summary snapshot (useful for reporting)
   */
  getSummary() {
    return {
      runType: this.runType,
      matched: this.matched,
      mismatched: this.mismatched,
      fixed: this.fixed,
      totalReviewed: this.matched + this.mismatched,
    };
  }
}