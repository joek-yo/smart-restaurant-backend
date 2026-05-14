// FILE: src/modules/smartpage/application/blocks/checkout-block.service.ts

import { Injectable } from '@nestjs/common';

import { RenderContextVO } from '../../domain/value-objects/render-context.vo';
import { SmartPageBlockEntity } from '../../domain/entities/smartpage-block.entity';

/**
 * CheckoutBlockService
 * --------------------
 * Renders checkout UI state inside SmartPage.
 *
 * Responsibilities:
 * - Reflect checkout engine state safely
 * - Show payment readiness / pending states
 * - Block unsafe checkout rendering
 * - Adapt UI based on session + cart + payment state
 */
@Injectable()
export class CheckoutBlockService {
  /**
   * Render a CHECKOUT block
   */
  render(
    block: SmartPageBlockEntity,
    context: RenderContextVO,
  ): Record<string, any> {
    const payload = block.payload ?? {};

    // ======================================================
    // 🧠 CHECKOUT STATE
    // ======================================================
    const checkout = context?.checkout ?? {};
    const cart = context?.cart ?? { items: [] };

    const hasItems = (cart.items ?? []).length > 0;
    const isActive = checkout.isActive ?? false;
    const isPaymentPending = checkout.isPaymentPending ?? false;
    const isConfirmed = checkout.isConfirmed ?? false;
    const isFailed = checkout.isFailed ?? false;

    // ======================================================
    // 🔒 SAFETY GUARD (NO ITEMS = NO CHECKOUT UI)
    // ======================================================
    if (!hasItems) {
      return {
        type: 'CHECKOUT',
        id: block.id,

        content: {
          title: payload.emptyTitle ?? 'Nothing to checkout',
          subtitle:
            payload.emptySubtitle ??
            'Add items to your cart before proceeding',
        },

        status: 'EMPTY',

        cta: {
          label: payload.emptyCta ?? 'Browse Products',
          action: 'NAVIGATE_CATALOG',
          enabled: false,
        },

        metadata: {
          hasItems,
        },
      };
    }

    // ======================================================
    // 🎯 CHECKOUT STATE RESOLUTION
    // ======================================================
    let status: string = 'IDLE';
    let title = payload.title ?? 'Checkout';
    let subtitle = payload.subtitle ?? 'Complete your order';

    if (isConfirmed) {
      status = 'CONFIRMED';
      title = payload.confirmedTitle ?? 'Order Confirmed';
      subtitle = payload.confirmedSubtitle ?? 'Thank you for your purchase';
    } else if (isFailed) {
      status = 'FAILED';
      title = payload.failedTitle ?? 'Payment Failed';
      subtitle =
        payload.failedSubtitle ?? 'Please try again or use another method';
    } else if (isPaymentPending) {
      status = 'PAYMENT_PENDING';
      title = payload.paymentPendingTitle ?? 'Processing Payment';
      subtitle =
        payload.paymentPendingSubtitle ??
        'Please wait while we confirm your payment';
    } else if (isActive) {
      status = 'ACTIVE';
      title = payload.activeTitle ?? title;
      subtitle = payload.activeSubtitle ?? subtitle;
    }

    // ======================================================
    // 📦 FINAL CHECKOUT OUTPUT
    // ======================================================
    return {
      type: 'CHECKOUT',
      id: block.id,

      status,

      content: {
        title,
        subtitle,
      },

      summary: {
        itemCount: cart.items?.length ?? 0,
        total: cart.total ?? 0,
      },

      cta: {
        label: payload.ctaLabel ?? 'Pay Now',
        action: payload.ctaAction ?? 'INITIATE_PAYMENT',
        enabled: status === 'ACTIVE' || status === 'PAYMENT_PENDING',
      },

      metadata: {
        isActive,
        isPaymentPending,
        isConfirmed,
        isFailed,
        hasItems,
      },
    };
  }
}