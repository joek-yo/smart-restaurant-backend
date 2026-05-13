// FILE: src/modules/protection/infrastructure/schedulers/stale-workflow.scheduler.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { RecoveryQueue } from '../queues/recovery.queue';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

// ✅ ADD THIS
import { OptOutProtectionService } from '../../application/services/opt-out-protection.service';

/**
 * StaleWorkflowScheduler
 * ---------------------------------------------------------
 * Background scanner for detecting stale or stuck workflows.
 *
 * Responsibilities:
 * - detect workflows that stopped progressing
 * - identify potential system hangs or inconsistencies
 * - trigger recovery pipeline for correction
 * - prevent silent workflow corruption over time
 *
 * OPT-OUT ENFORCEMENT:
 * - opted-out users MUST NEVER enter autonomous recovery systems
 *
 * Stale ≠ Abandoned:
 * - Abandoned = user inactivity
 * - Stale = system progress halted unexpectedly
 */

export interface StaleWorkflowCandidate {
  tenantId: string;
  userId: string;

  workflowType: 'conversation' | 'session' | 'checkout' | 'payment' | 'order';

  workflowId: string;

  currentState: string;

  lastUpdatedAt: Date;
}

@Injectable()
export class StaleWorkflowScheduler {
  constructor(
    private readonly recoveryQueue: RecoveryQueue,
    private readonly logger: ProtectionLoggerService,

    // ✅ ADD THIS
    private readonly optOutProtection: OptOutProtectionService,
  ) {}

  // ==================================================
  // ⏰ RUN EVERY 2 MINUTES (HIGH FREQUENCY CHECK)
  // ==================================================

  @Cron(CronExpression.EVERY_2_MINUTES)
  async scanStaleWorkflows(): Promise<void> {
    this.logger.log('StaleWorkflowScheduler', 'SCAN_STARTED', {});

    try {
      const staleWorkflows = await this.findStaleWorkflows();

      for (const workflow of staleWorkflows) {
        // ==================================================
        // 🚫 GLOBAL OPT-OUT ENFORCEMENT
        // ==================================================

        const suppression =
          await this.optOutProtection.isOptedOut({
            tenantId: workflow.tenantId,
            userId: workflow.userId,
          });

        if (suppression.isOptedOut) {
          this.logger.warn(
            'StaleWorkflowScheduler',
            'OPT_OUT_SKIPPED',
            {
              tenantId: workflow.tenantId,
              userId: workflow.userId,
              workflowId: workflow.workflowId,
            },
          );

          continue;
        }

        // ==================================================
        // 🚀 ENQUEUE RECOVERY JOB
        // ==================================================

        await this.recoveryQueue.addJob({
          payload: {
            tenantId: workflow.tenantId,
            userId: workflow.userId,
            workflowType: workflow.workflowType,
            workflowId: workflow.workflowId,
            currentState: workflow.currentState,
            recoveryReason: RecoveryReason.TIMEOUT,
          },
          priority: 7, // slightly higher priority than abandonment
        });
      }

      this.logger.log('StaleWorkflowScheduler', 'SCAN_COMPLETED', {
        count: staleWorkflows.length,
      });
    } catch (error: any) {
      this.logger.warn('StaleWorkflowScheduler', 'SCAN_FAILED', {
        error: error?.message,
      });
    }
  }

  // ==================================================
  // 🔍 DETECTION LOGIC (REPLACE WITH DB QUERY)
  // ==================================================

  private async findStaleWorkflows(): Promise<
    StaleWorkflowCandidate[]
  > {
    // Placeholder logic:
    // workflows with no state change > 3–5 minutes

    return [];
  }
}