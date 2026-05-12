// src/modules/payments/application/schedulers/reconciliation-job.scheduler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReconciliationService } from '../services/reconciliation.service';

/**
 * Reconciliation Job Scheduler
 * --------------------------------
 * Purpose:
 * Runs automated financial reconciliation between:
 * - Internal payment ledger
 * - MPESA external transaction records
 *
 * Ensures:
 * - No missing payments
 * - No phantom success states
 * - Ledger consistency
 */

@Injectable()
export class ReconciliationJobScheduler {
  private readonly logger = new Logger(ReconciliationJobScheduler.name);

  constructor(
    private readonly reconciliationService: ReconciliationService,
  ) {}

  /**
   * Runs every hour
   * (you can change to DAILY in production)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyReconciliation() {
    this.logger.log('🔄 Starting hourly reconciliation job...');

    try {
      const result = await this.reconciliationService.reconcile({
        range: 'HOURLY',
      });

      this.logger.log(
        `✅ Reconciliation completed | matched: ${result.matched} | fixed: ${result.fixed} | mismatched: ${result.mismatched}`,
      );
    } catch (error) {
      this.logger.error('❌ Reconciliation job failed', error);
    }
  }

  /**
   * Optional: Full daily deep reconciliation
   * Recommended for production financial systems
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyReconciliation() {
    this.logger.log('📊 Starting DAILY deep reconciliation...');

    try {
      const result = await this.reconciliationService.reconcile({
        range: 'DAILY',
        deepScan: true,
      });

      this.logger.log(
        `💰 DAILY reconciliation done | matched: ${result.matched} | fixed: ${result.fixed} | mismatched: ${result.mismatched}`,
      );
    } catch (error) {
      this.logger.error('❌ Daily reconciliation failed', error);
    }
  }
}