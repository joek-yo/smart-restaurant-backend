// FILE: src/modules/smartpage/application/blocks/hero-block.service.ts

import { Injectable } from '@nestjs/common';

import { RenderContextVO } from '../../domain/value-objects/render-context.vo';
import { SmartPageBlockEntity } from '../../domain/entities/smartpage-block.entity';

/**
 * HeroBlockService
 * -----------------
 * Renders HERO blocks into final UI-ready structure.
 *
 * Responsibilities:
 * - Apply personalization to hero content
 * - Resolve CTA behavior based on user context
 * - Inject resolved images (already pre-selected)
 * - Adapt messaging to user state (new, returning, abandoned cart)
 */
@Injectable()
export class HeroBlockService {
  /**
   * Render a HERO block
   */
  render(
    block: SmartPageBlockEntity,
    context: RenderContextVO,
  ): Record<string, any> {
    const payload = block.payload ?? {};

    // ======================================================
    // 🧠 PERSONALIZATION LAYER
    // ======================================================
    const isReturningUser = context?.user?.isReturning ?? false;
    const hasAbandonedCart = context?.cart?.hasItems ?? false;
    const isCheckoutActive = context?.checkout?.isActive ?? false;

    // ======================================================
    // 🎯 HERO COPY SELECTION
    // ======================================================
    let heading = payload.heading;
    let description = payload.description;
    let ctaPrimary = payload.ctaPrimary;
    let ctaSecondary = payload.ctaSecondary;

    // Personalization rules
    if (hasAbandonedCart) {
      heading = payload.abandonedCartHeading ?? heading;
      description = payload.abandonedCartDescription ?? description;
      ctaPrimary = payload.resumeCta ?? ctaPrimary;
    } else if (isReturningUser) {
      heading = payload.returningHeading ?? heading;
      description = payload.returningDescription ?? description;
    }

    // If user is deep in checkout, simplify hero
    if (isCheckoutActive) {
      heading = payload.checkoutHeading ?? heading;
      description = payload.checkoutDescription ?? description;
      ctaPrimary = payload.checkoutCta ?? ctaPrimary;
    }

    // ======================================================
    // 🖼️ IMAGE RESOLUTION (already pre-selected in pipeline)
    // ======================================================
    const image = (block as any).resolvedImage ?? payload.image;

    // ======================================================
    // 📦 FINAL HERO BLOCK OUTPUT
    // ======================================================
    return {
      type: 'HERO',

      id: block.id,

      content: {
        heading,
        description,
        ctaPrimary,
        ctaSecondary,
      },

      image,

      styling: payload.styling ?? {},

      metadata: {
        isReturningUser,
        hasAbandonedCart,
        isCheckoutActive,
      },
    };
  }
}