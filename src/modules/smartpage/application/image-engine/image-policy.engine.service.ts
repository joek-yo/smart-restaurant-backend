// src/modules/smartpage/application/image-engine/image-policy.engine.ts

import { Injectable } from '@nestjs/common';

/**
 * ImagePolicyEngine
 * ----------------------------------------------------
 * Applies image rendering rules for SmartPage blocks.
 *
 * This is NOT image selection.
 * This is RULE ENFORCEMENT over images.
 *
 * It decides:
 * - how images are delivered
 * - whether images are optimized/blurred/lazy-loaded
 * - fallback behavior
 * - CDN routing rules
 */

export interface ImagePolicyInput {
  imageUrl?: string;

  isHero?: boolean;
  isProduct?: boolean;
  isThumbnail?: boolean;

  userDevice?: 'mobile' | 'desktop';
  connectionSpeed?: 'slow' | 'medium' | 'fast';

  isReturningUser?: boolean;
  prefersLowDataMode?: boolean;
}

export interface ImagePolicyResult {
  finalUrl: string;

  lazyLoad: boolean;
  preload: boolean;

  blur: boolean;

  quality: number; // 1–100

  format: 'webp' | 'jpeg' | 'png' | 'auto';

  cdnStrategy: 'edge' | 'origin' | 'cache-first';

  fallbackUrl?: string;

  reason?: string;
}

@Injectable()
export class ImagePolicyEngine {
  /**
   * Applies deterministic rules to image rendering.
   */
  apply(input: ImagePolicyInput): ImagePolicyResult {
    const baseUrl = input.imageUrl || this.getFallback(input);

    // ==================================================
    // 📱 DEVICE RULES
    // ==================================================
    const isMobile = input.userDevice === 'mobile';

    // ==================================================
    // 🌐 CONNECTION RULES
    // ==================================================
    const isSlow = input.connectionSpeed === 'slow';

    // ==================================================
    // 🧠 DEFAULT POLICY
    // ==================================================
    let quality = 80;
    let blur = false;
    let lazyLoad = true;
    let preload = false;
    let format: 'webp' | 'jpeg' | 'png' | 'auto' = 'auto';
    let cdnStrategy: 'edge' | 'origin' | 'cache-first' = 'edge';

    // ==================================================
    // 🔥 HERO IMAGES (HIGH PRIORITY)
    // ==================================================
    if (input.isHero) {
      quality = 90;
      preload = true;
      lazyLoad = false;
      blur = false;
      format = 'webp';
      cdnStrategy = 'edge';
    }

    // ==================================================
    // 🛍️ PRODUCT IMAGES
    // ==================================================
    if (input.isProduct) {
      quality = 85;
      format = 'webp';
      cdnStrategy = 'cache-first';
    }

    // ==================================================
    // 📱 MOBILE OPTIMIZATION
    // ==================================================
    if (isMobile) {
      quality -= 10;
      lazyLoad = true;
      preload = false;
    }

    // ==================================================
    // 🐢 SLOW NETWORK OPTIMIZATION
    // ==================================================
    if (isSlow || input.prefersLowDataMode) {
      quality = 50;
      blur = true;
      format = 'jpeg';
      cdnStrategy = 'cache-first';
    }

    // ==================================================
    // 🔁 RETURNING USER OPTIMIZATION
    // ==================================================
    if (input.isReturningUser) {
      preload = false; // avoid redundant loading
      lazyLoad = true;
    }

    // ==================================================
    // 📉 QUALITY BOUNDARIES
    // ==================================================
    quality = Math.max(30, Math.min(100, quality));

    return {
      finalUrl: this.buildCdnUrl(baseUrl, quality, format),

      lazyLoad,
      preload,
      blur,
      quality,
      format,
      cdnStrategy,

      fallbackUrl: this.getFallback(input),

      reason: 'Image policy applied based on device + network + role',
    };
  }

  /**
   * Builds CDN-optimized URL
   */
  private buildCdnUrl(
    url: string,
    quality: number,
    format: string,
  ): string {
    return `${url}?q=${quality}&fmt=${format}`;
  }

  /**
   * Safe fallback image
   */
  private getFallback(input: ImagePolicyInput): string {
    if (input.isProduct) {
      return 'https://cdn.app/fallback/product.png';
    }

    if (input.isHero) {
      return 'https://cdn.app/fallback/hero.jpg';
    }

    return 'https://cdn.app/fallback/default.png';
  }
}