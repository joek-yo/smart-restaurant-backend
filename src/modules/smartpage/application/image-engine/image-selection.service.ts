// src/modules/smartpage/application/image-engine/image-selection.service.ts

import { Injectable } from '@nestjs/common';
import { ImagePolicyEngine, ImagePolicyInput } from './image-policy.engine';

/**
 * ImageSelectionService
 * ----------------------------------------------------
 * Responsible for selecting the BEST image variant
 * for a given SmartPage block.
 *
 * This is NOT policy enforcement (that’s ImagePolicyEngine).
 * This is DECISION MAKING on WHICH image to use.
 */

export interface ImageVariant {
  url: string;
  width?: number;
  height?: number;
  label?: string; // e.g. "thumbnail", "hero", "zoom", "alt"
}

export interface ImageSelectionInput {
  variants: ImageVariant[];

  blockType: 'HERO' | 'PRODUCT' | 'CATALOG' | 'CART' | 'CHECKOUT' | 'RECOMMENDATION';

  context: {
    isMobile?: boolean;
    isReturningUser?: boolean;
    connectionSpeed?: 'slow' | 'medium' | 'fast';
    prefersLowDataMode?: boolean;
  };
}

export interface ImageSelectionResult {
  selected: ImageVariant;
  policy: ReturnType<ImagePolicyEngine['apply']>;
  reason: string;
}

@Injectable()
export class ImageSelectionService {
  constructor(private readonly imagePolicy: ImagePolicyEngine) {}

  /**
   * Select best image variant per block + context
   */
  select(input: ImageSelectionInput): ImageSelectionResult {
    const variants = input.variants ?? [];

    if (!variants.length) {
      const fallback = this.getFallback(input.blockType);

      return {
        selected: fallback,
        policy: this.imagePolicy.apply({
          imageUrl: fallback.url,
          isHero: input.blockType === 'HERO',
          isProduct: input.blockType === 'PRODUCT',
          userDevice: input.context.isMobile ? 'mobile' : 'desktop',
          connectionSpeed: input.context.connectionSpeed,
          prefersLowDataMode: input.context.prefersLowDataMode,
        }),
        reason: 'No variants provided, using fallback image',
      };
    }

    // ==================================================
    // 🧠 BLOCK-BASED SELECTION STRATEGY
    // ==================================================

    let selected: ImageVariant = variants[0];

    // ==================================================
    // 🔥 HERO BLOCK → highest resolution priority
    // ==================================================
    if (input.blockType === 'HERO') {
      selected =
        this.pickBestByResolution(variants) || selected;
    }

    // ==================================================
    // 🛍️ PRODUCT BLOCK → balance quality + load speed
    // ==================================================
    if (input.blockType === 'PRODUCT') {
      selected =
        this.pickMediumQuality(variants) || selected;
    }

    // ==================================================
    // 🧺 CATALOG BLOCK → fastest loading variant
    // ==================================================
    if (input.blockType === 'CATALOG') {
      selected =
        this.pickFastest(variants) || selected;
    }

    // ==================================================
    // 🛒 CART / CHECKOUT → clarity over quality
    // ==================================================
    if (
      input.blockType === 'CART' ||
      input.blockType === 'CHECKOUT'
    ) {
      selected =
        this.pickStable(variants) || selected;
    }

    // ==================================================
    // 🧠 APPLY IMAGE POLICY
    // ==================================================
    const policy = this.imagePolicy.apply({
      imageUrl: selected.url,
      isHero: input.blockType === 'HERO',
      isProduct: input.blockType === 'PRODUCT',
      isThumbnail: input.blockType === 'CATALOG',
      userDevice: input.context.isMobile ? 'mobile' : 'desktop',
      connectionSpeed: input.context.connectionSpeed,
      prefersLowDataMode: input.context.prefersLowDataMode,
      isReturningUser: input.context.isReturningUser,
    });

    return {
      selected,
      policy,
      reason: `Selected ${input.blockType} optimized image variant`,
    };
  }

  // ==================================================
  // 🧠 SELECTION STRATEGIES
  // ==================================================

  private pickBestByResolution(variants: ImageVariant[]) {
    return [...variants].sort((a, b) => {
      const aScore = (a.width || 0) * (a.height || 0);
      const bScore = (b.width || 0) * (b.height || 0);
      return bScore - aScore;
    })[0];
  }

  private pickMediumQuality(variants: ImageVariant[]) {
    return variants.find(v => (v.width || 0) >= 800 && (v.width || 0) <= 1400)
      || variants[0];
  }

  private pickFastest(variants: ImageVariant[]) {
    return [...variants].sort((a, b) => (a.width || 0) - (b.width || 0))[0];
  }

  private pickStable(variants: ImageVariant[]) {
    return variants.find(v => v.label === 'stable')
      || variants.find(v => v.width === 800)
      || variants[0];
  }

  // ==================================================
  // 🧱 FALLBACK SYSTEM
  // ==================================================

  private getFallback(blockType: ImageSelectionInput['blockType']): ImageVariant {
    switch (blockType) {
      case 'HERO':
        return {
          url: 'https://cdn.app/fallback/hero.jpg',
          label: 'hero-fallback',
        };

      case 'PRODUCT':
        return {
          url: 'https://cdn.app/fallback/product.png',
          label: 'product-fallback',
        };

      case 'CATALOG':
        return {
          url: 'https://cdn.app/fallback/catalog.png',
          label: 'catalog-fallback',
        };

      default:
        return {
          url: 'https://cdn.app/fallback/default.png',
          label: 'default-fallback',
        };
    }
  }
}