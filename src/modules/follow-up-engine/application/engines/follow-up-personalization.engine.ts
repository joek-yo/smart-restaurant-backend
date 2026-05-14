// FILE: src/modules/follow-up-engine/application/engines/follow-up-personalization.engine.ts

import { Injectable } from '@nestjs/common';

import { FollowUpType } from '../../domain/enums/follow-up-type.enum';
import { FollowUpTriggerVO } from '../../domain/value-objects/follow-up-trigger.vo';

/**
 * FollowUpPersonalizationEngine
 * ------------------------------------------------------
 * BUILDS CONTEXTUAL FOLLOW-UP PAYLOADS.
 *
 * Responsibilities:
 * - assemble follow-up context
 * - normalize personalization data
 * - enrich follow-up metadata
 * - prepare delivery-ready payloads
 *
 * IMPORTANT:
 * - NO AI generation here
 * - NO message sending
 * - NO orchestration
 * - CONTEXT ASSEMBLY ONLY
 */

export interface BuildFollowUpPayloadInput {
  tenantId: string;
  userId: string;

  type: FollowUpType;

  trigger: FollowUpTriggerVO;

  // ==================================================
  // OPTIONAL CONTEXT SOURCES
  // ==================================================

  customerName?: string;

  cart?: {
    items?: Array<{
      productId?: string;
      name?: string;
      quantity?: number;
      price?: number;
    }>;

    totalAmount?: number;

    currency?: string;
  };

  payment?: {
    paymentId?: string;

    amount?: number;

    currency?: string;

    failureReason?: string;

    retryUrl?: string;
  };

  order?: {
    orderId?: string;

    status?: string;

    estimatedDeliveryAt?: Date;

    totalAmount?: number;
  };

  conversation?: {
    lastMessage?: string;

    lastIntent?: string;

    lastInteractionAt?: Date;
  };

  metadata?: Record<string, any>;
}

export interface FollowUpPersonalizationPayload {
  title: string;

  templateKey: string;

  variables: Record<string, any>;

  metadata: Record<string, any>;
}

@Injectable()
export class FollowUpPersonalizationEngine {
  // ==================================================
  // 🚦 MAIN ENTRY
  // ==================================================

  build(
    input: BuildFollowUpPayloadInput,
  ): FollowUpPersonalizationPayload {
    switch (input.type) {
      case FollowUpType.ABANDONED_CART:
        return this.buildAbandonedCartPayload(input);

      case FollowUpType.PAYMENT_RETRY:
        return this.buildPaymentRetryPayload(input);

      case FollowUpType.CHECKOUT_RESUME:
        return this.buildCheckoutResumePayload(input);

      case FollowUpType.ORDER_REMINDER:
        return this.buildOrderReminderPayload(input);

      case FollowUpType.REACTIVATION:
        return this.buildReactivationPayload(input);

      default:
        return this.buildGenericPayload(input);
    }
  }

  // ==================================================
  // 🛒 ABANDONED CART
  // ==================================================

  private buildAbandonedCartPayload(
    input: BuildFollowUpPayloadInput,
  ): FollowUpPersonalizationPayload {
    const itemCount =
      input.cart?.items?.length ?? 0;

    return {
      title: 'Complete your order',

      templateKey:
        'followup.abandoned_cart',

      variables: {
        customerName:
          input.customerName,

        itemCount,

        totalAmount:
          input.cart?.totalAmount,

        currency:
          input.cart?.currency,

        items:
          input.cart?.items ?? [],
      },

      metadata: {
        type: input.type,
        trigger:
          input.trigger.type,

        generatedAt:
          new Date().toISOString(),
      },
    };
  }

  // ==================================================
  // 💳 PAYMENT RETRY
  // ==================================================

  private buildPaymentRetryPayload(
    input: BuildFollowUpPayloadInput,
  ): FollowUpPersonalizationPayload {
    return {
      title: 'Payment retry required',

      templateKey:
        'followup.payment_retry',

      variables: {
        customerName:
          input.customerName,

        paymentId:
          input.payment?.paymentId,

        amount:
          input.payment?.amount,

        currency:
          input.payment?.currency,

        failureReason:
          input.payment?.failureReason,

        retryUrl:
          input.payment?.retryUrl,
      },

      metadata: {
        type: input.type,
        trigger:
          input.trigger.type,

        generatedAt:
          new Date().toISOString(),
      },
    };
  }

  // ==================================================
  // 🧾 CHECKOUT RESUME
  // ==================================================

  private buildCheckoutResumePayload(
    input: BuildFollowUpPayloadInput,
  ): FollowUpPersonalizationPayload {
    return {
      title: 'Resume your checkout',

      templateKey:
        'followup.checkout_resume',

      variables: {
        customerName:
          input.customerName,

        totalAmount:
          input.cart?.totalAmount,

        currency:
          input.cart?.currency,

        itemCount:
          input.cart?.items?.length ?? 0,
      },

      metadata: {
        type: input.type,
        trigger:
          input.trigger.type,

        generatedAt:
          new Date().toISOString(),
      },
    };
  }

  // ==================================================
  // 📦 ORDER REMINDER
  // ==================================================

  private buildOrderReminderPayload(
    input: BuildFollowUpPayloadInput,
  ): FollowUpPersonalizationPayload {
    return {
      title: 'Order reminder',

      templateKey:
        'followup.order_reminder',

      variables: {
        customerName:
          input.customerName,

        orderId:
          input.order?.orderId,

        orderStatus:
          input.order?.status,

        estimatedDeliveryAt:
          input.order?.estimatedDeliveryAt,

        totalAmount:
          input.order?.totalAmount,
      },

      metadata: {
        type: input.type,
        trigger:
          input.trigger.type,

        generatedAt:
          new Date().toISOString(),
      },
    };
  }

  // ==================================================
  // 🔄 REACTIVATION
  // ==================================================

  private buildReactivationPayload(
    input: BuildFollowUpPayloadInput,
  ): FollowUpPersonalizationPayload {
    return {
      title: 'We miss you',

      templateKey:
        'followup.reactivation',

      variables: {
        customerName:
          input.customerName,

        lastIntent:
          input.conversation?.lastIntent,

        lastInteractionAt:
          input.conversation?.lastInteractionAt,
      },

      metadata: {
        type: input.type,
        trigger:
          input.trigger.type,

        generatedAt:
          new Date().toISOString(),
      },
    };
  }

  // ==================================================
  // 🧩 GENERIC PAYLOAD
  // ==================================================

  private buildGenericPayload(
    input: BuildFollowUpPayloadInput,
  ): FollowUpPersonalizationPayload {
    return {
      title: 'Follow-up',

      templateKey:
        'followup.generic',

      variables: {
        customerName:
          input.customerName,
      },

      metadata: {
        type: input.type,
        trigger:
          input.trigger.type,

        generatedAt:
          new Date().toISOString(),
      },
    };
  }
}