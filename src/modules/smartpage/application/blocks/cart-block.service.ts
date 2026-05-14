// FILE: src/modules/smartpage/application/blocks/cart-block.service.ts

import { Injectable } from '@nestjs/common';

import { RenderContextVO } from '../../domain/value-objects/render-context.vo';
import { SmartPageBlockEntity } from '../../domain/entities/smartpage-block.entity';

/**
 * CartBlockService
 * ----------------
 * Renders CART block UI based on session/cart state.
 *
 * Responsibilities:
 * - Display cart items from session engine
 * - Calculate totals and summaries
 * - Adapt UI based on cart state (empty, active, abandoned)
 * - Support checkout CTA logic
 */
@Injectable()
export class CartBlockService {
  /**
   * Render a CART block
   */
  render(
    block: SmartPageBlockEntity,
    context: RenderContextVO,
  ): Record<string, any> {
    const payload = block.payload ?? {};

    // ======================================================
    // 🧠 SESSION / CART STATE
    // ======================================================
    const cart = context?.cart ?? { items: [], total: 0 };
    const items = cart.items ?? [];

    const hasItems = items.length > 0;
    const isAbandoned = context?.cart?.isAbandoned ?? false;

    // ======================================================
    // 💰 TOTAL CALCULATION (SAFE FALLBACK)
    // ======================================================
    const total = cart.total ?? items.reduce((sum: number, item: any) => {
      const price = item.price ?? 0;
      const qty = item.quantity ?? 1;
      return sum + price * qty;
    }, 0);

    // ======================================================
    // 🎯 CTA LOGIC
    // ======================================================
    let ctaLabel = payload.ctaLabel ?? 'Proceed to Checkout';
    let ctaEnabled = hasItems;

    if (!hasItems) {
      ctaLabel = payload.emptyCtaLabel ?? 'Start Shopping';
      ctaEnabled = false;
    }

    if (isAbandoned) {
      ctaLabel = payload.recoverCtaLabel ?? 'Resume Your Order';
      ctaEnabled = true;
    }

    // ======================================================
    // 📦 EMPTY STATE
    // ======================================================
    if (!hasItems) {
      return {
        type: 'CART',
        id: block.id,

        content: {
          title: payload.emptyTitle ?? 'Your cart is empty',
          subtitle:
            payload.emptySubtitle ?? 'Add items to start your order',
        },

        items: [],
        total: 0,

        cta: {
          label: ctaLabel,
          enabled: ctaEnabled,
          action: 'NAVIGATE_CATALOG',
        },

        metadata: {
          hasItems,
          isAbandoned,
        },
      };
    }

    // ======================================================
    // 📦 ACTIVE CART OUTPUT
    // ======================================================
    return {
      type: 'CART',
      id: block.id,

      content: {
        title: payload.title ?? 'Your Cart',
        subtitle: isAbandoned
          ? payload.abandonedSubtitle ?? 'You left items behind'
          : payload.subtitle ?? 'Review your order',
      },

      items,

      summary: {
        total,
        itemCount: items.length,
      },

      cta: {
        label: ctaLabel,
        enabled: ctaEnabled,
        action: payload.ctaAction ?? 'PROCEED_TO_CHECKOUT',
      },

      metadata: {
        hasItems,
        isAbandoned,
      },
    };
  }
}