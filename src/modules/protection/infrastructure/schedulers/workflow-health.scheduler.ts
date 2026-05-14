// FILE: src/modules/protection/infrastructure/schedulers/workflow-health.scheduler.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { WorkflowHealthMonitorService } from '../observability/workflow-health-monitor.service';
import { AnomalyDetectorService } from '../observability/anomaly-detector.service';

import { RecoveryQueue } from '../queues/recovery.queue';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

// ✅ ADD THIS
import { OptOutProtectionService } from '../../application/services/opt-out-protection.service';

/**
 * WorkflowHealthScheduler
 * ---------------------------------------------------------
 * Periodic system-wide workflow health analyzer.
 *
 * Responsibilities:
 * - analyze workflow system health metrics
 * - detect anomalies and degradation patterns
 * - trigger recovery for unhealthy workflows
 * - maintain proactive system stability
 *
 * OPT-OUT ENFORCEMENT:
 * - opted-out users MUST NEVER enter autonomous recovery systems
 *
 * This is the AUTONOMOUS INTELLIGENCE layer:
 * Metrics → Health Analysis → Anomaly Detection → Recovery Queue
 */

export interface UnhealthyWorkflowCandidate {
  tenantId: string;
  userId: string;

  workflowType: 'conversation' | 'session' | 'checkout' | 'payment' | 'order';

  workflowId: string;

  currentState: string;

  healthScore: number;

  anomalyType?: string;
}

@Injectable()
export class WorkflowHealthScheduler {
  constructor(
    private readonly healthMonitor: WorkflowHealthMonitorService,
    private readonly anomalyDetector: AnomalyDetectorService,
    private readonly recoveryQueue: RecoveryQueue,
    private readonly logger: ProtectionLoggerService,

    // ✅ ADD THIS
    private readonly optOutProtection: OptOutProtectionService,
  ) {}

  // ==================================================
  // ⏰ RUN EVERY 10 MINUTES
  // ==================================================

  @Cron(CronExpression.EVERY_10_MINUTES)
  async runHealthAnalysis(): Promise<void> {
    this.logger.log('info', 'WorkflowHealthScheduler', 'HEALTH_SCAN_STARTED', {});

    try {
      // ==================================================
      // 📊 COLLECT HEALTH METRICS
      // ==================================================

      const healthData = await this.healthMonitor.collect();

      // ==================================================
      // 🔍 DETECT ANOMALIES
      // ==================================================

      const anomalies =
        await this.anomalyDetector.detect(healthData);

      // ==================================================
      // 🛑 OPT-OUT FILTER + RECOVERY ENQUEUE
      // ==================================================

      for (const anomaly of anomalies) {
        const suppression =
          await this.optOutProtection.isOptedOut(anomaly.metadata?.userId ?? '', anomaly.tenantId);

        if (suppression) {
          this.logger.warn('WorkflowHealthScheduler',
            'OPT_OUT_SKIPPED',
            {
              tenantId: anomaly.tenantId,
              userId: anomaly.metadata?.userId ?? '',
              workflowId: anomaly.workflow,
            },
          );

          continue;
        }

        await this.recoveryQueue.addJob({
          payload: {
            tenantId: anomaly.tenantId,
            userId: anomaly.metadata?.userId ?? '',
            workflowType: anomaly.workflow as 'conversation' | 'session' | 'checkout' | 'payment' | 'order',
            workflowId: anomaly.workflow,
            currentState: anomaly.metadata?.currentState ?? '',
            recoveryReason: RecoveryReason.TIMEOUT,
          },
          priority: this.calculatePriority(anomaly.metadata?.healthScore ?? 50),
        });
      }

      this.logger.log('info', 'WorkflowHealthScheduler',
        'HEALTH_SCAN_COMPLETED',
        {
          metadata: { anomaliesDetected: anomalies.length },
        },
      );
    } catch (error: any) {
      this.logger.warn('WorkflowHealthScheduler', 'HEALTH_SCAN_FAILED', {
        error: error?.message,
      });
    }
  }

  // ==================================================
  // 🎯 PRIORITY ENGINE
  // ==================================================

  private calculatePriority(healthScore: number): number {
    // lower health score = higher priority recovery
    if (healthScore < 30) return 10;
    if (healthScore < 60) return 7;
    return 5;
  }
}