// FILE: src/modules/protection/infrastructure/schedulers/abandoned-session.scheduler.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { RecoveryQueue } from '../queues/recovery.queue';

import { RecoveryReason } from '../../application/use-cases/recovery.pipeline';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

// ✅ ADD THIS
import { OptOutProtectionService } from '../../application/services/opt-out-protection.service';

/**
 * AbandonedSessionScheduler
 * ---------------------------------------------------------
 * Background scheduler for detecting abandoned sessions.
 *
 * Responsibilities:
 * - scan for inactive sessions
 * - trigger recovery pipeline asynchronously
 * - prevent session loss in user journeys
 * - maintain system continuity for long-running flows
 *
 * OPT-OUT ENFORCEMENT:
 * - opted-out users MUST NEVER enter recovery automation
 *
 * This is part of autonomous protection layer:
 * Scheduler → Queue → RecoveryPipeline → UseCases
 */

export interface AbandonedSessionCandidate {
  tenantId: string;
  userId: string;

  sessionId: string;

  currentState: string;

  lastActivityAt: Date;
}

@Injectable()
export class AbandonedSessionScheduler {
  constructor(
    private readonly recoveryQueue: RecoveryQueue,
    private readonly logger: ProtectionLoggerService,

    // ✅ ADD THIS
    private readonly optOutProtection: OptOutProtectionService,
  ) {}

  // ==================================================
  // ⏰ RUN EVERY 5 MINUTES
  // ==================================================

  @Cron(CronExpression.EVERY_5_MINUTES)
  async scanAbandonedSessions(): Promise<void> {
    this.logger.log('AbandonedSessionScheduler', 'SCAN_STARTED', {});

    try {
      // NOTE: In real implementation, this would query DB/session store
      const abandonedSessions =
        await this.findAbandonedSessions();

      for (const session of abandonedSessions) {
        // ==================================================
        // 🚫 GLOBAL OPT-OUT ENFORCEMENT
        // ==================================================

        const suppression =
          await this.optOutProtection.isOptedOut({
            tenantId: session.tenantId,
            userId: session.userId,
          });

        if (suppression.isOptedOut) {
          this.logger.warn(
            'AbandonedSessionScheduler',
            'OPT_OUT_SKIPPED',
            {
              tenantId: session.tenantId,
              userId: session.userId,
              sessionId: session.sessionId,
            },
          );

          continue;
        }

        // ==================================================
        // 🚀 ENQUEUE RECOVERY JOB
        // ==================================================

        await this.recoveryQueue.addJob({
          payload: {
            tenantId: session.tenantId,
            userId: session.userId,
            workflowType: 'session',
            workflowId: session.sessionId,
            currentState: session.currentState,
            recoveryReason: RecoveryReason.TIMEOUT,
          },

          priority: 5,
        });
      }

      this.logger.log(
        'AbandonedSessionScheduler',
        'SCAN_COMPLETED',
        {
          count: abandonedSessions.length,
        },
      );
    } catch (error: any) {
      this.logger.warn(
        'AbandonedSessionScheduler',
        'SCAN_FAILED',
        {
          error: error?.message,
        },
      );
    }
  }

  // ==================================================
  // 🔍 MOCK DETECTION LOGIC (REPLACE WITH DB QUERY)
  // ==================================================

  private async findAbandonedSessions(): Promise<
    AbandonedSessionCandidate[]
  > {
    // Placeholder logic for detection threshold:
    // sessions inactive > 10 minutes

    return [];
  }
}