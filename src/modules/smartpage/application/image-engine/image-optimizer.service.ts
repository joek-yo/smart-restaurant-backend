// src/modules/smartpage/application/image-engine/image-optimizer.service.ts

import { Injectable } from '@nestjs/common';

/**
 * ImageOptimizerService
 * ----------------------------------------------------
 * Final stage image optimization service.
 *
 * This runs AFTER:
 * - image selection (which image to use)
 * - image policy (how to treat it)
 *
 * This service focuses on:
 * - CDN URL transformation
 * - compression hints
 * - responsive sizing
 * - format negotiation
 *
 * It is the FINAL IMAGE PIPELINE STEP before rendering.
 */

export interface ImageOptimizationInput {
  url: string;

  quality: number;
  format: 'webp' | 'jpeg' | 'png' | 'auto';

  width?: number;
  height?: number;

  device?: 'mobile' | 'desktop';
  connection?: 'slow' | 'medium' | 'fast';

  cdnStrategy?: 'edge' | 'origin' | 'cache-first';

  enableResponsive?: boolean;
}

export interface ImageOptimizationResult {
  optimizedUrl: string;

  headers: Record<string, string>;

  responsiveSet?: string[];

  compressionLevel: number;

  cacheStrategy: string;

  reason: string;
}

@Injectable()
export class ImageOptimizerService {
  /**
   * Final optimization step before rendering images
   */
  optimize(input: ImageOptimizationInput): ImageOptimizationResult {
    const baseUrl = input.url;

    // ==================================================
    // 📉 QUALITY NORMALIZATION
    // ==================================================
    let quality = input.quality;

    if (input.connection === 'slow') {
      quality = Math.min(quality, 55);
    }

    if (input.device === 'mobile') {
      quality = Math.min(quality, 75);
    }

    quality = Math.max(30, Math.min(100, quality));

    // ==================================================
    // 🧩 FORMAT OPTIMIZATION
    // ==================================================
    let format = input.format;

    if (format === 'auto') {
      format = this.detectBestFormat(input);
    }

    // ==================================================
    // 🌍 CDN URL BUILD
    // ==================================================
    const optimizedUrl = this.buildCdnUrl(baseUrl, {
      quality,
      format,
      width: input.width,
      height: input.height,
      cdn: input.cdnStrategy ?? 'edge',
    });

    // ==================================================
    // 📱 RESPONSIVE SET GENERATION
    // ==================================================
    const responsiveSet = input.enableResponsive
      ? this.generateResponsiveSet(baseUrl, quality, format)
      : undefined;

    // ==================================================
    // 🚀 CACHE STRATEGY
    // ==================================================
    const cacheStrategy = this.resolveCacheStrategy(input.cdnStrategy);

    return {
      optimizedUrl,
      headers: this.buildHeaders(cacheStrategy),
      responsiveSet,
      compressionLevel: 100 - quality,
      cacheStrategy,
      reason: 'Final CDN optimization applied',
    };
  }

  // ==================================================
  // 🧠 FORMAT DETECTION
  // ==================================================
  private detectBestFormat(
    input: ImageOptimizationInput,
  ): 'webp' | 'jpeg' | 'png' {
    if (input.device === 'mobile') return 'webp';

    if (input.connection === 'slow') return 'jpeg';

    return 'webp';
  }

  // ==================================================
  // 🌐 CDN URL BUILDER
  // ==================================================
  private buildCdnUrl(
    url: string,
    params: {
      quality: number;
      format: string;
      width?: number;
      height?: number;
      cdn: string;
    },
  ): string {
    const query: string[] = [];

    query.push(`q=${params.quality}`);
    query.push(`fmt=${params.format}`);

    if (params.width) query.push(`w=${params.width}`);
    if (params.height) query.push(`h=${params.height}`);

    query.push(`cdn=${params.cdn}`);

    return `${url}?${query.join('&')}`;
  }

  // ==================================================
  // 📱 RESPONSIVE IMAGE SET
  // ==================================================
  private generateResponsiveSet(
    url: string,
    quality: number,
    format: string,
  ): string[] {
    const widths = [320, 640, 960, 1280];

    return widths.map(
      (w) => `${url}?w=${w}&q=${quality}&fmt=${format}`,
    );
  }

  // ==================================================
  // 🚀 CACHE STRATEGY
  // ==================================================
  private resolveCacheStrategy(
    strategy?: 'edge' | 'origin' | 'cache-first',
  ): string {
    switch (strategy) {
      case 'edge':
        return 'EDGE_CACHE_TTL_24H';

      case 'origin':
        return 'NO_EDGE_CACHE';

      case 'cache-first':
      default:
        return 'EDGE_CACHE_LONG_TTL';
    }
  }

  // ==================================================
  // 📦 HEADERS BUILDER
  // ==================================================
  private buildHeaders(cacheStrategy: string): Record<string, string> {
    return {
      'Cache-Control': cacheStrategy,
      'X-Image-Optimizer': 'SmartPageEngine-v1',
    };
  }
}