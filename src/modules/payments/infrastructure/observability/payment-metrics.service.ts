// src/modules/payments/infrastructure/observability/payment-metrics.service.ts

import { Injectable, Logger } from '@nestjs/common';

/**
 * PaymentMetricsService
 * ---------------------------------------------------
 * PURPOSE:
 * Central observability + monitoring layer for payments.
 *
 * RESPONSIBILITIES:
 * - payment success/failure tracking
 * - provider latency monitoring
 * - Prometheus-compatible metric exports
 * - histogram bucket aggregation
 * - operational visibility
 *
 * MVP STORAGE:
 * - in-memory metrics
 *
 * PRODUCTION UPGRADE PATH:
 * - Prometheus
 * - Grafana
 * - OpenTelemetry
 * - ClickHouse
 * - Redis aggregation
 */

type Provider =
  | 'MPESA'
  | 'STRIPE'
  | 'AGGREGATOR';

type PaymentStatus =
  | 'SUCCESS'
  | 'FAILED';

interface PaymentMetricEvent {
  provider: Provider;
  status: PaymentStatus;
  latencyMs?: number;
}

interface HistogramBuckets {
  le_100: number;
  le_300: number;
  le_500: number;
  le_1000: number;
  le_3000: number;
  le_5000: number;
  gt_5000: number;
}

interface ProviderMetrics {
  total: number;
  success: number;
  failed: number;

  latencySum: number;
  latencyCount: number;
  maxLatencyMs: number;
  minLatencyMs: number;

  histogram: HistogramBuckets;
}

interface ProviderStats {
  total: number;
  success: number;
  failed: number;

  successRate: number;
  failureRate: number;

  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;

  histogram: HistogramBuckets;
}

@Injectable()
export class PaymentMetricsService {
  private readonly logger = new Logger(
    PaymentMetricsService.name,
  );

  /**
   * In-memory metric store
   */
  private readonly metrics = new Map<
    Provider,
    ProviderMetrics
  >();

  // =====================================================
  // 📊 RECORD PAYMENT EVENT
  // =====================================================

  /**
   * Records payment outcome + latency metrics
   */
  record(event: PaymentMetricEvent): void {
    const metrics =
      this.getOrInitialize(event.provider);

    metrics.total += 1;

    // =====================================================
    // SUCCESS / FAILURE COUNTERS
    // =====================================================

    if (event.status === 'SUCCESS') {
      metrics.success += 1;
    } else {
      metrics.failed += 1;
    }

    // =====================================================
    // LATENCY TRACKING
    // =====================================================

    if (
      typeof event.latencyMs === 'number'
    ) {
      metrics.latencySum +=
        event.latencyMs;

      metrics.latencyCount += 1;

      metrics.maxLatencyMs = Math.max(
        metrics.maxLatencyMs,
        event.latencyMs,
      );

      metrics.minLatencyMs = Math.min(
        metrics.minLatencyMs,
        event.latencyMs,
      );

      this.recordHistogramBucket(
        metrics.histogram,
        event.latencyMs,
      );
    }

    this.metrics.set(
      event.provider,
      metrics,
    );

    this.logger.log(
      `[PAYMENT_METRIC_RECORDED] provider=${event.provider} status=${event.status} latency=${event.latencyMs ?? 'n/a'}ms`,
    );
  }

  // =====================================================
  // 📈 PROVIDER STATS
  // =====================================================

  getProviderStats(
    provider: Provider,
  ): ProviderStats {
    const metrics =
      this.getOrInitialize(provider);

    const successRate = metrics.total
      ? metrics.success / metrics.total
      : 0;

    const failureRate = metrics.total
      ? metrics.failed / metrics.total
      : 0;

    const avgLatencyMs =
      metrics.latencyCount > 0
        ? metrics.latencySum /
          metrics.latencyCount
        : 0;

    return {
      total: metrics.total,
      success: metrics.success,
      failed: metrics.failed,

      successRate: Number(
        successRate.toFixed(4),
      ),

      failureRate: Number(
        failureRate.toFixed(4),
      ),

      avgLatencyMs: Number(
        avgLatencyMs.toFixed(2),
      ),

      minLatencyMs:
        metrics.minLatencyMs === Infinity
          ? 0
          : metrics.minLatencyMs,

      maxLatencyMs:
        metrics.maxLatencyMs,

      histogram: metrics.histogram,
    };
  }

  // =====================================================
  // 🌍 SYSTEM-WIDE STATS
  // =====================================================

  getSystemStats() {
    const providers: Provider[] = [
      'MPESA',
      'STRIPE',
      'AGGREGATOR',
    ];

    return providers.reduce(
      (acc, provider) => {
        acc[provider] =
          this.getProviderStats(provider);

        return acc;
      },
      {} as Record<
        Provider,
        ProviderStats
      >,
    );
  }

  // =====================================================
  // 📤 PROMETHEUS EXPORT
  // =====================================================

  /**
   * Prometheus-compatible metrics export
   */
  exportPrometheusMetrics(): string {
    const providers: Provider[] = [
      'MPESA',
      'STRIPE',
      'AGGREGATOR',
    ];

    const lines: string[] = [];

    lines.push(
      '# HELP payment_total Total payment attempts',
    );
    lines.push(
      '# TYPE payment_total counter',
    );

    lines.push(
      '# HELP payment_success_total Successful payments',
    );
    lines.push(
      '# TYPE payment_success_total counter',
    );

    lines.push(
      '# HELP payment_failed_total Failed payments',
    );
    lines.push(
      '# TYPE payment_failed_total counter',
    );

    lines.push(
      '# HELP payment_latency_avg_ms Average provider latency',
    );
    lines.push(
      '# TYPE payment_latency_avg_ms gauge',
    );

    for (const provider of providers) {
      const stats =
        this.getProviderStats(provider);

      const providerLabel =
        provider.toLowerCase();

      lines.push(
        `payment_total{provider="${providerLabel}"} ${stats.total}`,
      );

      lines.push(
        `payment_success_total{provider="${providerLabel}"} ${stats.success}`,
      );

      lines.push(
        `payment_failed_total{provider="${providerLabel}"} ${stats.failed}`,
      );

      lines.push(
        `payment_latency_avg_ms{provider="${providerLabel}"} ${stats.avgLatencyMs}`,
      );

      lines.push(
        `payment_latency_max_ms{provider="${providerLabel}"} ${stats.maxLatencyMs}`,
      );

      lines.push(
        `payment_latency_min_ms{provider="${providerLabel}"} ${stats.minLatencyMs}`,
      );

      // =====================================================
      // HISTOGRAM EXPORT
      // =====================================================

      const histogram =
        stats.histogram;

      lines.push(
        `payment_latency_bucket{provider="${providerLabel}",le="100"} ${histogram.le_100}`,
      );

      lines.push(
        `payment_latency_bucket{provider="${providerLabel}",le="300"} ${histogram.le_300}`,
      );

      lines.push(
        `payment_latency_bucket{provider="${providerLabel}",le="500"} ${histogram.le_500}`,
      );

      lines.push(
        `payment_latency_bucket{provider="${providerLabel}",le="1000"} ${histogram.le_1000}`,
      );

      lines.push(
        `payment_latency_bucket{provider="${providerLabel}",le="3000"} ${histogram.le_3000}`,
      );

      lines.push(
        `payment_latency_bucket{provider="${providerLabel}",le="5000"} ${histogram.le_5000}`,
      );

      lines.push(
        `payment_latency_bucket{provider="${providerLabel}",le="+Inf"} ${histogram.gt_5000}`,
      );
    }

    return lines.join('\n');
  }

  // =====================================================
  // 📦 HISTOGRAM BUCKETS
  // =====================================================

  private recordHistogramBucket(
    histogram: HistogramBuckets,
    latencyMs: number,
  ) {
    if (latencyMs <= 100) {
      histogram.le_100++;
      return;
    }

    if (latencyMs <= 300) {
      histogram.le_300++;
      return;
    }

    if (latencyMs <= 500) {
      histogram.le_500++;
      return;
    }

    if (latencyMs <= 1000) {
      histogram.le_1000++;
      return;
    }

    if (latencyMs <= 3000) {
      histogram.le_3000++;
      return;
    }

    if (latencyMs <= 5000) {
      histogram.le_5000++;
      return;
    }

    histogram.gt_5000++;
  }

  // =====================================================
  // 🧱 SAFE INITIALIZER
  // =====================================================

  private getOrInitialize(
    provider: Provider,
  ): ProviderMetrics {
    if (!this.metrics.has(provider)) {
      this.metrics.set(provider, {
        total: 0,
        success: 0,
        failed: 0,

        latencySum: 0,
        latencyCount: 0,

        maxLatencyMs: 0,
        minLatencyMs: Infinity,

        histogram: {
          le_100: 0,
          le_300: 0,
          le_500: 0,
          le_1000: 0,
          le_3000: 0,
          le_5000: 0,
          gt_5000: 0,
        },
      });
    }

    return this.metrics.get(provider)!;
  }
}