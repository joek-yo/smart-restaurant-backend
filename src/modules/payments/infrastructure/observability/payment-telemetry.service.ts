// src/modules/payments/infrastructure/observability/payment-telemetry.service.ts

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Payment Telemetry Service
 * ---------------------------------------------------
 * PURPOSE:
 * - End-to-end lifecycle tracing for every payment
 * - CorrelationId propagation across system boundaries
 * - Structured observability events
 * - Failure diagnostics
 * - Provider performance visibility
 *
 * THINK OF IT AS:
 * "Distributed tracing layer for the payment engine"
 *
 * PRODUCTION UPGRADE PATH:
 * - OpenTelemetry
 * - Datadog APM
 * - Grafana Tempo
 * - Jaeger
 * - ELK stack
 */

export type PaymentProvider =
  | 'MPESA'
  | 'STRIPE'
  | 'AGGREGATOR';

export type PaymentStage =
  | 'INITIATED'
  | 'PROVIDER_REQUESTED'
  | 'PROVIDER_CALLBACK_RECEIVED'
  | 'PROVIDER_VERIFIED'
  | 'RETRY_SCHEDULED'
  | 'RETRY_EXECUTED'
  | 'RECONCILIATION_STARTED'
  | 'RECONCILED'
  | 'CONFIRMED'
  | 'FAILED';

export type PaymentTelemetryStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'PENDING';

export interface PaymentTelemetryEvent {
  paymentId: string;

  correlationId: string;

  orderId?: string;

  provider: PaymentProvider;

  stage: PaymentStage;

  status: PaymentTelemetryStatus;

  latencyMs?: number;

  retryAttempt?: number;

  providerReference?: string;

  errorCode?: string;

  errorMessage?: string;

  metadata?: Record<string, any>;
}

interface TraceContext {
  correlationId: string;
  startedAt: number;
}

@Injectable()
export class PaymentTelemetryService {
  private readonly logger = new Logger(
    PaymentTelemetryService.name,
  );

  /**
   * Active payment trace contexts
   *
   * key = paymentId
   */
  private readonly traces = new Map<
    string,
    TraceContext
  >();

  // =====================================================
  // 🚀 START PAYMENT TRACE
  // =====================================================
  start(
    paymentId: string,
    correlationId?: string,
  ): string {
    const finalCorrelationId =
      correlationId || this.generateCorrelationId();

    this.traces.set(paymentId, {
      correlationId: finalCorrelationId,
      startedAt: Date.now(),
    });

    this.logger.log(
      `[TRACE_START] payment=${paymentId} correlationId=${finalCorrelationId}`,
    );

    return finalCorrelationId;
  }

  // =====================================================
  // 📡 TRACK EVENT
  // =====================================================
  track(
    event: Omit<
      PaymentTelemetryEvent,
      'correlationId' | 'latencyMs'
    > & {
      correlationId?: string;
    },
  ): void {
    const trace = this.traces.get(event.paymentId);

    const correlationId =
      event.correlationId ||
      trace?.correlationId ||
      this.generateCorrelationId();

    const latencyMs = trace
      ? Date.now() - trace.startedAt
      : undefined;

    const enrichedEvent: PaymentTelemetryEvent = {
      ...event,
      correlationId,
      latencyMs,
    };

    this.logger.log(
      JSON.stringify({
        type: 'PAYMENT_TELEMETRY',
        timestamp: new Date().toISOString(),
        paymentId: enrichedEvent.paymentId,
        correlationId,
        provider: enrichedEvent.provider,
        stage: enrichedEvent.stage,
        status: enrichedEvent.status,
        latencyMs,
        retryAttempt: enrichedEvent.retryAttempt,
        providerReference:
          enrichedEvent.providerReference,
        errorCode: enrichedEvent.errorCode,
      }),
    );

    this.sendToAnalytics(enrichedEvent);

    if (this.isTerminalStage(event.stage)) {
      this.complete(event.paymentId);
    }
  }

  // =====================================================
  // ❌ STRUCTURED FAILURE TRACKING
  // =====================================================
  recordFailure(params: {
    paymentId: string;
    provider: PaymentProvider;
    stage: PaymentStage;
    error: Error;
    correlationId?: string;
    metadata?: Record<string, any>;
  }) {
    this.track({
      paymentId: params.paymentId,
      provider: params.provider,
      stage: params.stage,
      status: 'FAILED',
      correlationId: params.correlationId,
      errorCode: params.error.name,
      errorMessage: params.error.message,
      metadata: params.metadata,
    });
  }

  // =====================================================
  // 🔁 RETRY TRACE EVENT
  // =====================================================
  recordRetry(params: {
    paymentId: string;
    provider: PaymentProvider;
    retryAttempt: number;
    correlationId?: string;
    metadata?: Record<string, any>;
  }) {
    this.track({
      paymentId: params.paymentId,
      provider: params.provider,
      stage: 'RETRY_SCHEDULED',
      status: 'PENDING',
      retryAttempt: params.retryAttempt,
      correlationId: params.correlationId,
      metadata: params.metadata,
    });
  }

  // =====================================================
  // 🔎 GET CORRELATION ID
  // =====================================================
  getCorrelationId(
    paymentId: string,
  ): string | undefined {
    return this.traces.get(paymentId)
      ?.correlationId;
  }

  // =====================================================
  // 🧹 COMPLETE TRACE
  // =====================================================
  complete(paymentId: string): void {
    const trace = this.traces.get(paymentId);

    if (!trace) return;

    const totalLatency =
      Date.now() - trace.startedAt;

    this.logger.log(
      `[TRACE_COMPLETE] payment=${paymentId} correlationId=${trace.correlationId} totalLatency=${totalLatency}ms`,
    );

    this.traces.delete(paymentId);
  }

  // =====================================================
  // 📤 ANALYTICS PIPELINE
  // =====================================================
  private sendToAnalytics(
    event: PaymentTelemetryEvent,
  ) {
    /**
     * FUTURE INTEGRATIONS:
     *
     * - OpenTelemetry
     * - Prometheus
     * - Grafana Loki
     * - Datadog
     * - ELK stack
     * - Kafka event stream
     */

    const analyticsPayload = {
      timestamp: new Date().toISOString(),
      ...event,
    };

    // Placeholder sink
    void analyticsPayload;
  }

  // =====================================================
  // 🔐 GENERATE CORRELATION ID
  // =====================================================
  private generateCorrelationId(): string {
    return crypto.randomUUID();
  }

  // =====================================================
  // 🛑 TERMINAL STATES
  // =====================================================
  private isTerminalStage(
    stage: PaymentStage,
  ): boolean {
    return (
      stage === 'CONFIRMED' ||
      stage === 'FAILED'
    );
  }
}