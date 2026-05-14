// FILE: src/modules/protection/application/coordinators/workflow-consistency.service.ts

import { Injectable } from '@nestjs/common';

import { WorkflowStatus } from '../../domain/enums/workflow-status.enum';
import { WorkflowAnomalyType } from '../../domain/enums/workflow-anomaly-type.enum';

import { WorkflowAnomalyEntity } from '../../domain/entities/workflow-anomaly.entity';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { SessionProtectionService } from '../services/session-protection.service';
import { ConversationProtectionService } from '../services/conversation-protection.service';
import { CheckoutProtectionService } from '../services/checkout-protection.service';
import { PaymentProtectionService } from '../services/payment-protection.service';
import { OrderProtectionService } from '../services/order-protection.service';

import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * WorkflowConsistencyService
 * -------------------------------------------------------
 * CENTRAL CONSISTENCY AUTHORITY.
 *
 * Responsibilities:
 * - validate workflow correctness
 * - detect invalid cross-module states
 * - detect stale/corrupted workflows
 * - detect impossible transitions
 * - ensure workflow ordering integrity
 *
 * IMPORTANT:
 * This service DOES NOT mutate workflows.
 * It ONLY validates and reports anomalies.
 */

export interface WorkflowConsistencyInput {
  workflowType?: string;
  workflowId?: string;
  currentState?: string;
  tenantId: string;
  userId: string;

  conversationState?: string;
  sessionState?: string;
  checkoutState?: string;
  paymentState?: string;
  orderState?: string;

  metadata?: Record<string, any>;
}

export interface WorkflowConsistencyResult {
  valid: boolean;
  anomalies: WorkflowAnomalyEntity[];
  workflowStatus: WorkflowStatus;
  anomalyDetected: boolean;
  anomalyType?: WorkflowAnomalyType;
}

@Injectable()
export class WorkflowConsistencyService {
  constructor(
    private readonly timelineService: WorkflowTimelineService,

    private readonly sessionProtection: SessionProtectionService,
    private readonly conversationProtection: ConversationProtectionService,
    private readonly checkoutProtection: CheckoutProtectionService,
    private readonly paymentProtection: PaymentProtectionService,
    private readonly orderProtection: OrderProtectionService,

    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚦 MAIN ENTRY POINT
  // ==================================================

  async validate(
    input: WorkflowConsistencyInput,
  ): Promise<WorkflowConsistencyResult> {
    const anomalies: WorkflowAnomalyEntity[] = [];

    // ==================================================
    // 🧠 DOMAIN-SPECIFIC VALIDATIONS
    // ==================================================

    anomalies.push(
      ...(await this.validateConversationConsistency(input)),
    );

    anomalies.push(
      ...(await this.validateSessionConsistency(input)),
    );

    anomalies.push(
      ...(await this.validateCheckoutConsistency(input)),
    );

    anomalies.push(
      ...(await this.validatePaymentConsistency(input)),
    );

    anomalies.push(
      ...(await this.validateOrderConsistency(input)),
    );

    // ==================================================
    // 🔥 CROSS-WORKFLOW VALIDATIONS
    // ==================================================

    anomalies.push(
      ...this.validateCrossWorkflowConsistency(input),
    );

    // ==================================================
    // 🧭 TIMELINE VALIDATION
    // ==================================================

    anomalies.push(
      ...(await this.validateTimelineIntegrity(input)),
    );

    // ==================================================
    // 📊 FINAL STATUS
    // ==================================================

    const valid = anomalies.length === 0;

    const workflowStatus = valid
      ? WorkflowStatus.HEALTHY
      : WorkflowStatus.CORRUPTED;

    // ==================================================
    // 📝 OBSERVABILITY
    // ==================================================

    this.logger.info(
      'WorkflowConsistencyService',
      valid
        ? 'WORKFLOW_CONSISTENCY_VALID'
        : 'WORKFLOW_CONSISTENCY_FAILED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          anomalies: anomalies.length,
          workflowStatus,
        },
      },
    );

    return {
      valid,
      anomalies,
      workflowStatus,
      anomalyDetected: anomalies.length > 0,
    };
  }

  // ==================================================
  // 💬 CONVERSATION VALIDATION
  // ==================================================

  private async validateConversationConsistency(
    input: WorkflowConsistencyInput,
  ): Promise<WorkflowAnomalyEntity[]> {
    const anomalies: WorkflowAnomalyEntity[] = [];

    if (!input.conversationState) {
      return anomalies;
    }

    const valid =
      await this.conversationProtection.validateState(
        input.conversationState,
      );

    if (!valid) {
      anomalies.push(
        this.buildAnomaly(
          input,
          WorkflowAnomalyType.INVALID_CONVERSATION_STATE,
          `Invalid conversation state: ${input.conversationState}`,
        ),
      );
    }

    return anomalies;
  }

  // ==================================================
  // 🧠 SESSION VALIDATION
  // ==================================================

  private async validateSessionConsistency(
    input: WorkflowConsistencyInput,
  ): Promise<WorkflowAnomalyEntity[]> {
    const anomalies: WorkflowAnomalyEntity[] = [];

    if (!input.sessionState) {
      return anomalies;
    }

    const valid =
      await this.sessionProtection.validateState(
        input.sessionState,
      );

    if (!valid) {
      anomalies.push(
        this.buildAnomaly(
          input,
          WorkflowAnomalyType.INVALID_SESSION_STATE,
          `Invalid session state: ${input.sessionState}`,
        ),
      );
    }

    return anomalies;
  }

  // ==================================================
  // 🛒 CHECKOUT VALIDATION
  // ==================================================

  private async validateCheckoutConsistency(
    input: WorkflowConsistencyInput,
  ): Promise<WorkflowAnomalyEntity[]> {
    const anomalies: WorkflowAnomalyEntity[] = [];

    if (!input.checkoutState) {
      return anomalies;
    }

    const valid =
      await this.checkoutProtection.validateState(
        input.checkoutState,
      );

    if (!valid) {
      anomalies.push(
        this.buildAnomaly(
          input,
          WorkflowAnomalyType.INVALID_CHECKOUT_STATE,
          `Invalid checkout state: ${input.checkoutState}`,
        ),
      );
    }

    return anomalies;
  }

  // ==================================================
  // 💳 PAYMENT VALIDATION
  // ==================================================

  private async validatePaymentConsistency(
    input: WorkflowConsistencyInput,
  ): Promise<WorkflowAnomalyEntity[]> {
    const anomalies: WorkflowAnomalyEntity[] = [];

    if (!input.paymentState) {
      return anomalies;
    }

    const valid =
      await this.paymentProtection.validateState(
        input.paymentState,
      );

    if (!valid) {
      anomalies.push(
        this.buildAnomaly(
          input,
          WorkflowAnomalyType.INVALID_PAYMENT_STATE,
          `Invalid payment state: ${input.paymentState}`,
        ),
      );
    }

    return anomalies;
  }

  // ==================================================
  // 📦 ORDER VALIDATION
  // ==================================================

  private async validateOrderConsistency(
    input: WorkflowConsistencyInput,
  ): Promise<WorkflowAnomalyEntity[]> {
    const anomalies: WorkflowAnomalyEntity[] = [];

    if (!input.orderState) {
      return anomalies;
    }

    const valid =
      await this.orderProtection.validateState(
        input.orderState,
      );

    if (!valid) {
      anomalies.push(
        this.buildAnomaly(
          input,
          WorkflowAnomalyType.INVALID_ORDER_STATE,
          `Invalid order state: ${input.orderState}`,
        ),
      );
    }

    return anomalies;
  }

  // ==================================================
  // 🔥 CROSS-WORKFLOW RULES
  // ==================================================

  private validateCrossWorkflowConsistency(
    input: WorkflowConsistencyInput,
  ): WorkflowAnomalyEntity[] {
    const anomalies: WorkflowAnomalyEntity[] = [];

    // ----------------------------------------------
    // ORDER CONFIRMED WITHOUT PAYMENT
    // ----------------------------------------------
    if (
      input.orderState === 'CONFIRMED' &&
      input.paymentState !== 'SUCCESS'
    ) {
      anomalies.push(
        this.buildAnomaly(
          input,
          WorkflowAnomalyType.ORDER_PAYMENT_MISMATCH,
          'Order confirmed before successful payment',
        ),
      );
    }

    // ----------------------------------------------
    // PAYMENT SUCCESS WITHOUT CHECKOUT
    // ----------------------------------------------
    if (
      input.paymentState === 'SUCCESS' &&
      !input.checkoutState
    ) {
      anomalies.push(
        this.buildAnomaly(
          input,
          WorkflowAnomalyType.PAYMENT_WITHOUT_CHECKOUT,
          'Payment exists without checkout workflow',
        ),
      );
    }

    // ----------------------------------------------
    // CHECKOUT ACTIVE WITHOUT SESSION
    // ----------------------------------------------
    if (
      input.checkoutState &&
      !input.sessionState
    ) {
      anomalies.push(
        this.buildAnomaly(
          input,
          WorkflowAnomalyType.CHECKOUT_WITHOUT_SESSION,
          'Checkout active without session',
        ),
      );
    }

    return anomalies;
  }

  // ==================================================
  // 🧭 TIMELINE VALIDATION
  // ==================================================

  private async validateTimelineIntegrity(
    input: WorkflowConsistencyInput,
  ): Promise<WorkflowAnomalyEntity[]> {
    const anomalies: WorkflowAnomalyEntity[] = [];

    const timeline =
      await this.timelineService.getTimeline(
        input.tenantId,
        input.userId,
      );

    if (!timeline) {
      return anomalies;
    }

    // Basic event ordering integrity
    if (
      timeline.events.length > 0 &&
      !timeline.events.every(
        (e, i, arr) =>
          i === 0 ||
          e.timestamp >= arr[i - 1].timestamp,
      )
    ) {
      anomalies.push(
        this.buildAnomaly(
          input,
          WorkflowAnomalyType.TIMELINE_CORRUPTION,
          'Workflow timeline contains invalid ordering',
        ),
      );
    }

    return anomalies;
  }

  // ==================================================
  // 🏗️ ANOMALY FACTORY
  // ==================================================

  private buildAnomaly(
    input: WorkflowConsistencyInput,
    type: WorkflowAnomalyType,
    reason: string,
  ): WorkflowAnomalyEntity {
    return new WorkflowAnomalyEntity({
      tenantId: input.tenantId,
      userId: input.userId,
      type,
      reason,
      metadata: {
        conversationState: input.conversationState,
        sessionState: input.sessionState,
        checkoutState: input.checkoutState,
        paymentState: input.paymentState,
        orderState: input.orderState,
      },
      detectedAt: new Date(),
    });
  }
}