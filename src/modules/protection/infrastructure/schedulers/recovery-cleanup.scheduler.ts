// FILE: src/modules/protection/infrastructure/schedulers/recovery-cleanup.scheduler.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';
import { RecoverySessionMongoRepository } from '../persistence/recovery-session.mongo.repository';
import { ProtectionReportMongoRepository } from '../persistence/protection-report.mongo.repository';

/**
 * RecoveryCleanupScheduler
 * ---------------------------------------------------------
 * Background cleanup job for recovery-related artifacts.
 *
 * Responsibilities:
 * - remove old recovery sessions (retention policy)
 * - clean stale protection reports
 * - reduce database bloat
 * - keep observability storage optimized
 *
 * IMPORTANT:
 * This does NOT affect active workflows.
 * Only archival / historical recovery data.
 */

@Injectable()
export class RecoveryCleanupScheduler {
  constructor(
    private readonly recoverySessionRepo: RecoverySessionMongoRepository,
    private readonly protectionReportRepo: ProtectionReportMongoRepository,
    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // ⏰ DAILY CLEANUP JOB
  // ==================================================

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runCleanup(): Promise<void> {
    this.logger.log('info', 'RecoveryCleanupScheduler', 'CLEANUP_STARTED', {});

    try {
      const cutoffDate = this.getRetentionCutoff();

      // ==================================================
      // 🧹 CLEAN RECOVERY SESSIONS
      // ==================================================

      await this.cleanupRecoverySessions(cutoffDate);

      // ==================================================
      // 🧹 CLEAN PROTECTION REPORTS
      // ==================================================

      await (this.cleanupProtectionReports as any)('RecoveryCleanupScheduler', 'CLEANUP_COMPLETED', { cutoffDate });
    } catch (error: any) {
      this.logger.warn('RecoveryCleanupScheduler', 'CLEANUP_FAILED', {
        error: error?.message,
      });
    }
  }

  // ==================================================
  // 🧹 RECOVERY SESSION CLEANUP
  // ==================================================

  private async cleanupRecoverySessions(cutoffDate: Date): Promise<void> {
    const sessions = await this.recoverySessionRepo.findByUser(
      '', // wildcard tenant not used here in real impl
      '',
    );

    for (const session of sessions) {
      if (session && new Date(session['createdAt']) < cutoffDate) {
        await this.recoverySessionRepo.deleteById(session['id']);
      }
    }
  }

  // ==================================================
  // 🧹 PROTECTION REPORT CLEANUP
  // ==================================================

  private async cleanupProtectionReports(
    cutoffDate: Date,
  ): Promise<void> {
    const reports =
      await this.protectionReportRepo.findByTenant('');

    for (const report of reports) {
      if (report && new Date(report['createdAt']) < cutoffDate) {
        await this.protectionReportRepo.deleteById(report['id']);
      }
    }
  }

  // ==================================================
  // ⏳ RETENTION POLICY
  // ==================================================

  private getRetentionCutoff(): Date {
    const daysToKeep = 30; // configurable retention policy
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);
    return cutoff;
  }
}