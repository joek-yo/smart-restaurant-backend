// src/modules/smartpage/application/renderer/block-renderer.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { SmartPageBlock } from '../../domain/entities/smartpage-block.entity';
import { RenderContext } from '../../domain/value-objects/render-context.vo';

/**
 * BlockRendererService
 * ---------------------
 * Renders a single SmartPage block into UI-ready output.
 *
 * This is the atomic rendering unit of the SmartPage engine.
 */
@Injectable()
export class BlockRendererService {
  private readonly logger = new Logger(BlockRendererService.name);

  /**
   * MAIN ENTRY
   */
  render(
    block: SmartPageBlock,
    context: RenderContext,
  ): any {
    switch (block.type) {
      // ==================================================
      // 🧠 HERO BLOCK
      // ==================================================
      case 'HERO':
        return this.renderHero(block, context);

      // ==================================================
      // 🛍️ PRODUCT BLOCK
      // ==================================================
      case 'PRODUCT':
        return this.renderProduct(block, context);

      // ==================================================
      // 🗂️ CATALOG BLOCK
      // ==================================================
      case 'CATALOG':
        return this.renderCatalog(block, context);

      // ==================================================
      // 🛒 CART BLOCK
      // ==================================================
      case 'CART':
        return this.renderCart(block, context);

      // ==================================================
      // 💳 CHECKOUT BLOCK
      // ==================================================
      case 'CHECKOUT':
        return this.renderCheckout(block, context);

      // ==================================================
      // 🎯 RECOMMENDATION BLOCK
      // ==================================================
      case 'RECOMMENDATION':
        return this.renderRecommendation(block, context);

      // ==================================================
      // 📢 BANNER BLOCK
      // ==================================================
      case 'BANNER':
        return this.renderBanner(block, context);

      // ==================================================
      // 📝 TEXT BLOCK
      // ==================================================
      case 'TEXT':
        return this.renderText(block, context);

      default:
        this.logger.warn(
          `[BlockRenderer] Unknown block type: ${block.type}`,
        );

        return null;
    }
  }

  // ==================================================
  // 🧠 HERO
  // ==================================================
  private renderHero(block: SmartPageBlock, context: RenderContext) {
    return {
      type: 'HERO',
      title: block.payload?.title,
      subtitle: block.payload?.subtitle,

      ctaPrimary: block.payload?.ctaPrimary,
      ctaSecondary: block.payload?.ctaSecondary,

      style: this.resolveStyle(block, context),
    };
  }

  // ==================================================
  // 🛍️ PRODUCT
  // ==================================================
  private renderProduct(
    block: SmartPageBlock,
    context: RenderContext,
  ) {
    const products = context.catalog?.products ?? [];

    return {
      type: 'PRODUCT',
      items: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        isAvailable: p.isAvailable,
      })),

      style: this.resolveStyle(block, context),
    };
  }

  // ==================================================
  // 🗂️ CATALOG
  // ==================================================
  private renderCatalog(
    block: SmartPageBlock,
    context: RenderContext,
  ) {
    return {
      type: 'CATALOG',
      categories: context.catalog?.categories ?? [],
      style: this.resolveStyle(block, context),
    };
  }

  // ==================================================
  // 🛒 CART
  // ==================================================
  private renderCart(block: SmartPageBlock, context: RenderContext) {
    const cart = context.session?.cart;

    return {
      type: 'CART',
      items: cart?.items ?? [],
      total: cart?.total ?? 0,
      isEmpty: !cart?.items?.length,

      style: this.resolveStyle(block, context),
    };
  }

  // ==================================================
  // 💳 CHECKOUT
  // ==================================================
  private renderCheckout(
    block: SmartPageBlock,
    context: RenderContext,
  ) {
    return {
      type: 'CHECKOUT',
      mode: context.resolved.checkoutMode,

      isActive:
        context.resolved.checkoutMode === 'ACTIVE',

      style: this.resolveStyle(block, context),
    };
  }

  // ==================================================
  // 🎯 RECOMMENDATION
  // ==================================================
  private renderRecommendation(
    block: SmartPageBlock,
    context: RenderContext,
  ) {
    return {
      type: 'RECOMMENDATION',
      items: context.user?.recommendations ?? [],

      intentSignals: context.resolved.intentSignals,

      style: this.resolveStyle(block, context),
    };
  }

  // ==================================================
  // 📢 BANNER
  // ==================================================
  private renderBanner(
    block: SmartPageBlock,
    context: RenderContext,
  ) {
    return {
      type: 'BANNER',
      message: block.payload?.message,

      variant: block.payload?.variant ?? 'info',

      style: this.resolveStyle(block, context),
    };
  }

  // ==================================================
  // 📝 TEXT
  // ==================================================
  private renderText(block: SmartPageBlock, context: RenderContext) {
    return {
      type: 'TEXT',
      content: block.payload?.content,

      style: this.resolveStyle(block, context),
    };
  }

  // ==================================================
  // 🎨 STYLE RESOLUTION (GLOBAL RULE)
  // ==================================================
  private resolveStyle(
    block: SmartPageBlock,
    context: RenderContext,
  ) {
    return {
      theme: context.business?.branding,
      visibility: block.visibilityRules,
      priority: block.priority,
    };
  }
}