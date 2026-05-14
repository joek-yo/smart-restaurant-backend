// FILE: src/modules/smartpage/application/blocks/product-block.service.ts

import { Injectable } from '@nestjs/common';

import { RenderContextVO } from '../../domain/value-objects/render-context.vo';
import { SmartPageBlockEntity } from '../../domain/entities/smartpage-block.entity';

/**
 * ProductBlockService
 * -------------------
 * Renders a SINGLE product showcase block.
 *
 * Responsibilities:
 * - Resolve product display data
 * - Apply pricing/discount formatting rules
 * - Adapt CTA based on cart state
 * - Inject resolved image from pipeline
 */
@Injectable()
export class ProductBlockService {
  /**
   * Render a PRODUCT block
   */
  render(
    block: SmartPageBlockEntity,
    context: RenderContextVO,
  ): Record<string, any> {
    const payload = block.payload ?? {};
    const product = payload.product ?? {};

    // ======================================================
    // 🧠 CONTEXT SIGNALS
    // ======================================================
    const cartItems = context?.cart?.items ?? [];
    const isInCart = cartItems.some((item: any) => item.productId === product.id);
    const isReturningUser = context?.user?.isReturning ?? false;

    // ======================================================
    // 💰 PRICING LOGIC
    // ======================================================
    const price = product.price;
    const oldPrice = product.oldPrice;

    const hasDiscount = typeof oldPrice === 'number' && oldPrice > price;

    const discountPercent = hasDiscount
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0;

    // ======================================================
    // 🎯 CTA LOGIC
    // ======================================================
    let ctaLabel = payload.ctaLabel ?? 'Add to Cart';

    if (isInCart) {
      ctaLabel = payload.inCartCtaLabel ?? 'Added ✓';
    } else if (isReturningUser) {
      ctaLabel = payload.returningCtaLabel ?? 'Buy Now';
    }

    // ======================================================
    // 🖼️ IMAGE RESOLUTION (pre-selected upstream)
    // ======================================================
    const image = (block as any).resolvedImage ?? product.image;

    // ======================================================
    // 📦 FINAL PRODUCT BLOCK OUTPUT
    // ======================================================
    return {
      type: 'PRODUCT',
      id: block.id,

      product: {
        id: product.id,
        name: product.name,
        description: product.description,

        price,
        oldPrice: hasDiscount ? oldPrice : undefined,
        discountPercent,

        isAvailable: product.isAvailable ?? true,
        isOutOfStock: product.isOutOfStock ?? false,
      },

      image,

      cta: {
        label: ctaLabel,
        action: payload.ctaAction ?? 'ADD_TO_CART',
      },

      metadata: {
        isInCart,
        isReturningUser,
        hasDiscount,
      },
    };
  }
}