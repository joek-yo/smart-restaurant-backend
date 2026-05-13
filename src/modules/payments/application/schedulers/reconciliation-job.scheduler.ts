import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReconciliationService } from '../services/reconciliation.service';

@Injectable()
export class ReconciliationJobScheduler {
  private readonly logger = new Logger(ReconciliationJobScheduler.name);

  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyReconciliation() {
    this.logger.log('🔄 Starting hourly reconciliation job...');
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 60 * 60 * 1000);
      await this.reconciliationService.reconcile({ from, to: now, mode: 'HOURLY' });
      this.logger.log('✅ Hourly reconciliation completed');
    } catch (error) {
      this.logger.error('❌ Reconciliation job failed', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyReconciliation() {
    this.logger.log('📊 Starting DAILY deep reconciliation...');
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      await this.reconciliationService.reconcile({ from, to: now, mode: 'DAILY' });
      this.logger.log('💰 DAILY reconciliation completed');
    } catch (error) {
      this.logger.error('❌ Daily reconciliation failed', error);
    }
  }
}
