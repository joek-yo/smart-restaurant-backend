// FILE: src/modules/smartpage/application/blocks/catalog-block.service.ts

import { Injectable } from '@nestjs/common';

import { RenderContextVO } from '../../domain/value-objects/render-context.vo';
import { SmartPageBlockEntity } from '../../domain/entities/smartpage-block.entity';

/**
 * CatalogBlockService
 * -------------------
 * Renders product catalog sections dynamically.
 *
 * Responsibilities:
 * - Filter products by availability
 * - Apply category-based grouping
 * - Adapt catalog based on user context
 * - Support empty-state handling
 */
@Injectable()
export class CatalogBlockService {
  /**
   * Render a CATALOG block
   */
  render(
    block: SmartPageBlockEntity,
    context: RenderContextVO,
  ): Record<string, any> {
    const payload = block.payload ?? {};

    const categoryId = payload.categoryId;
    const products = payload.products ?? [];

    // ======================================================
    // 🧠 CONTEXT SIGNALS
    // ======================================================
    const isReturningUser = context?.user?.isReturning ?? false;
    const hasAbandonedCart = context?.cart?.hasItems ?? false;

    // ======================================================
    // 📦 FILTER AVAILABLE PRODUCTS
    // ======================================================
    const availableProducts = products.filter((p: any) => {
      if (p.isAvailable === false) return false;
      if (p.isOutOfStock === true) return false;
      return true;
    });

    // ======================================================
    // 🎯 PERSONALIZATION LOGIC
    // ======================================================
    let title = payload.title ?? 'Products';
    let subtitle = payload.subtitle;

    if (hasAbandonedCart) {
      subtitle =
        payload.abandonedCartSubtitle ??
        'Complete your order — these items are still waiting for you';
    } else if (isReturningUser) {
      subtitle =
        payload.returningSubtitle ?? 'Welcome back — picked just for you';
    }

    // ======================================================
    // 📦 EMPTY STATE HANDLING
    // ======================================================
    if (!availableProducts.length) {
      return {
        type: 'CATALOG',
        id: block.id,
        categoryId,

        content: {
          title,
          subtitle,
          emptyState: {
            title: payload.emptyTitle ?? 'No products available',
            description:
              payload.emptyDescription ??
              'Check back later for new items',
          },
        },

        products: [],
      };
    }

    // ======================================================
    // 📦 FINAL CATALOG OUTPUT
    // ======================================================
    return {
      type: 'CATALOG',
      id: block.id,

      categoryId,

      content: {
        title,
        subtitle,
      },

      products: availableProducts,

      metadata: {
        totalProducts: products.length,
        availableProducts: availableProducts.length,
        isReturningUser,
        hasAbandonedCart,
      },
    };
  }
}