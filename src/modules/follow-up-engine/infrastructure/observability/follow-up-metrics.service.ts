// FILE: src/modules/follow-up-engine/infrastructure/observability/follow-up-metrics.service.ts

import { Injectable } from '@nestjs/common';

import { FollowUpType } from '../../domain/enums/follow-up-type.enum';

/**
 * FollowUpMetricsService
 * -------------------------------------------------------
 * CENTRALIZED METRICS SERVICE
 * FOR FOLLOW-UP ENGINE.
 *
 * Responsibilities:
 * - track scheduled follow-ups
 * - track sent follow-ups
 * - track cancellations
 * - track failures
 * - track recoveries
 * - future CTR analytics
 *
 * IMPORTANT:
 * This service is STORAGE-AGNOSTIC.
 * Can later connect to:
 * - Prometheus
 * - Datadog
 * - Grafana
 * - OpenTelemetry
 */

export interface FollowUpMetricContext {
  tenantId?: string;

  userId?: string;

  workflowType?: string;

  followUpType?: FollowUpType;

  channel?: string;

  metadata?: Record<string, any>;
}

@Injectable()
export class FollowUpMetricsService {
  // ==================================================
  // 📊 IN-MEMORY METRICS
  // (replace later with real metrics backend)
  // ==================================================

  private readonly metrics = {
    scheduled: 0,

    sent: 0,

    cancelled: 0,

    failed: 0,

    recovered: 0,

    retried: 0,

    clicked: 0,
  };

  // ==================================================
  // 🚀 SCHEDULED
  // ==================================================

  async recordScheduled(
    context: FollowUpMetricContext,
  ): Promise<void> {
    this.metrics.scheduled += 1;

    this.logMetric(
      'FOLLOW_UP_SCHEDULED',
      context,
    );
  }

  // ==================================================
  // 📤 SENT
  // ==================================================

  async recordSent(
    context: FollowUpMetricContext,
  ): Promise<void> {
    this.metrics.sent += 1;

    this.logMetric(
      'FOLLOW_UP_SENT',
      context,
    );
  }

  // ==================================================
  // ❌ FAILED
  // ==================================================

  async recordFailed(
    context: FollowUpMetricContext,
  ): Promise<void> {
    this.metrics.failed += 1;

    this.logMetric(
      'FOLLOW_UP_FAILED',
      context,
    );
  }

  // ==================================================
  // 🚫 CANCELLED
  // ==================================================

  async recordCancelled(
    context: FollowUpMetricContext,
  ): Promise<void> {
    this.metrics.cancelled += 1;

    this.logMetric(
      'FOLLOW_UP_CANCELLED',
      context,
    );
  }

  // ==================================================
  // ♻️ RECOVERED
  // ==================================================

  async recordRecovered(
    context: FollowUpMetricContext,
  ): Promise<void> {
    this.metrics.recovered += 1;

    this.logMetric(
      'FOLLOW_UP_RECOVERED',
      context,
    );
  }

  // ==================================================
  // 🔁 RETRIED
  // ==================================================

  async recordRetried(
    context: FollowUpMetricContext,
  ): Promise<void> {
    this.metrics.retried += 1;

    this.logMetric(
      'FOLLOW_UP_RETRIED',
      context,
    );
  }

  // ==================================================
  // 👆 CLICKED (CTR FUTURE)
  // ==================================================

  async recordClicked(
    context: FollowUpMetricContext,
  ): Promise<void> {
    this.metrics.clicked += 1;

    this.logMetric(
      'FOLLOW_UP_CLICKED',
      context,
    );
  }

  // ==================================================
  // 📈 SNAPSHOT
  // ==================================================

  async getMetricsSnapshot() {
    const ctr =
      this.metrics.sent > 0
        ? (
            (this.metrics.clicked /
              this.metrics.sent) *
            100
          ).toFixed(2)
        : '0.00';

    return {
      ...this.metrics,

      ctrPercentage: `${ctr}%`,
    };
  }

  // ==================================================
  // 🧹 RESET
  // ==================================================

  async reset(): Promise<void> {
    this.metrics.scheduled = 0;
    this.metrics.sent = 0;
    this.metrics.cancelled = 0;
    this.metrics.failed = 0;
    this.metrics.recovered = 0;
    this.metrics.retried = 0;
    this.metrics.clicked = 0;
  }

  // ==================================================
  // 🛰️ INTERNAL OBSERVABILITY
  // ==================================================

  private logMetric(
    metric: string,
    context: FollowUpMetricContext,
  ) {
    console.log(
      JSON.stringify({
        metric,

        timestamp:
          new Date().toISOString(),

        tenantId:
          context.tenantId,

        userId:
          context.userId,

        workflowType:
          context.workflowType,

        followUpType:
          context.followUpType,

        channel:
          context.channel,

        metadata:
          context.metadata ?? {},
      }),
    );
  }
}