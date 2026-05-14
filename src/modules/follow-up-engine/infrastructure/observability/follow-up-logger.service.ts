// FILE: src/modules/follow-up-engine/infrastructure/observability/follow-up-logger.service.ts

import {
  Injectable,
  Logger,
} from '@nestjs/common';

/**
 * FollowUpLoggerService
 * -------------------------------------------------------
 * CENTRALIZED STRUCTURED OBSERVABILITY
 * FOR FOLLOW-UP ENGINE.
 *
 * Responsibilities:
 * - scheduling logs
 * - execution logs
 * - cancellation logs
 * - retry logs
 * - failure logs
 * - recovery observability
 *
 * IMPORTANT:
 * ALL follow-up logs flow through here.
 * Prevents inconsistent logging patterns.
 */

export interface FollowUpLogContext {
  tenantId?: string;

  userId?: string;

  followUpJobId?: string;

  queueJobId?: string;

  workflowId?: string;

  workflowType?: string;

  followUpType?: string;

  metadata?: Record<string, any>;
}

@Injectable()
export class FollowUpLoggerService {
  private readonly logger = new Logger(
    FollowUpLoggerService.name,
  );

  // ==================================================
  // 🚀 GENERIC INFO
  // ==================================================

  info(
    source: string,
    event: string,
    context?: FollowUpLogContext,
  ) {
    this.logger.log(
      this.buildMessage(
        source,
        event,
        context,
      ),
    );
  }

  // ==================================================
  // ⚠️ WARNING
  // ==================================================

  warn(
    source: string,
    event: string,
    context?: FollowUpLogContext,
  ) {
    this.logger.warn(
      this.buildMessage(
        source,
        event,
        context,
      ),
    );
  }

  // ==================================================
  // ❌ ERROR
  // ==================================================

  error(
    source: string,
    event: string,
    context?: FollowUpLogContext,
    error?: Error,
  ) {
    this.logger.error(
      this.buildMessage(
        source,
        event,
        context,
      ),
      error?.stack,
    );
  }

  // ==================================================
  // 🧠 SCHEDULING
  // ==================================================

  logScheduled(
    context: FollowUpLogContext,
  ) {
    this.info(
      'FollowUpScheduler',
      'FOLLOW_UP_SCHEDULED',
      context,
    );
  }

  // ==================================================
  // ▶️ EXECUTION
  // ==================================================

  logExecutionStarted(
    context: FollowUpLogContext,
  ) {
    this.info(
      'FollowUpWorker',
      'FOLLOW_UP_EXECUTION_STARTED',
      context,
    );
  }

  logExecutionCompleted(
    context: FollowUpLogContext,
  ) {
    this.info(
      'FollowUpWorker',
      'FOLLOW_UP_EXECUTION_COMPLETED',
      context,
    );
  }

  // ==================================================
  // ❌ EXECUTION FAILURE
  // ==================================================

  logExecutionFailed(
    context: FollowUpLogContext,
    error?: Error,
  ) {
    this.error(
      'FollowUpWorker',
      'FOLLOW_UP_EXECUTION_FAILED',
      context,
      error,
    );
  }

  // ==================================================
  // 🔁 RETRY
  // ==================================================

  logRetryScheduled(
    context: FollowUpLogContext,
  ) {
    this.warn(
      'FollowUpWorker',
      'FOLLOW_UP_RETRY_SCHEDULED',
      context,
    );
  }

  // ==================================================
  // 🚫 CANCELLATION
  // ==================================================

  logCancelled(
    context: FollowUpLogContext,
  ) {
    this.warn(
      'FollowUpCancelService',
      'FOLLOW_UP_CANCELLED',
      context,
    );
  }

  // ==================================================
  // ♻️ RESCHEDULE
  // ==================================================

  logRescheduled(
    context: FollowUpLogContext,
  ) {
    this.info(
      'FollowUpRescheduleService',
      'FOLLOW_UP_RESCHEDULED',
      context,
    );
  }

  // ==================================================
  // 🛰️ INTERNAL FORMATTER
  // ==================================================

  private buildMessage(
    source: string,
    event: string,
    context?: FollowUpLogContext,
  ): string {
    return JSON.stringify({
      timestamp:
        new Date().toISOString(),

      source,

      event,

      tenantId:
        context?.tenantId,

      userId:
        context?.userId,

      followUpJobId:
        context?.followUpJobId,

      queueJobId:
        context?.queueJobId,

      workflowId:
        context?.workflowId,

      workflowType:
        context?.workflowType,

      followUpType:
        context?.followUpType,

      metadata:
        context?.metadata ?? {},
    });
  }
}