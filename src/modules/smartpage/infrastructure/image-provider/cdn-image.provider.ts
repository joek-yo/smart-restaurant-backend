// src/modules/smartpage/infrastructure/image-provider/cdn-image.provider.ts

import { Injectable, Logger } from '@nestjs/common';
import {
  ImageProviderInterface,
  ImageRequest,
  ImageVariant,
} from './image-provider.interface';

/**
 * CDNImageProvider
 * ------------------------------------------------------
 * CDN-based image delivery implementation.
 *
 * Purpose:
 * - Serve images through a CDN layer (CloudFront, Cloudflare, etc.)
 * - Optimize latency via edge caching
 * - Provide fast global delivery for SmartPage rendering
 *
 * NOTE:
 * This provider assumes images are already stored in origin (S3, storage, etc.)
 * and CDN is responsible for acceleration.
 */

@Injectable()
export class CDNImageProvider implements ImageProviderInterface {
  private readonly logger = new Logger(CDNImageProvider.name);

  // ======================================================
  // 🖼️ GET SINGLE IMAGE VIA CDN
  // ======================================================
  async getImage(request: ImageRequest): Promise<ImageVariant | null> {
    try {
      const url = this.buildCdnUrl(request.imageId, request);

      const variant: ImageVariant = {
        url,
        width: request.width,
        height: request.height,
        format: 'auto', // CDN can negotiate format (webp/avif/jpeg)
        isOptimized: true,
        source: 'cdn',
      };

      this.logger.debug(
        `[CDNImageProvider] fetched image ${request.imageId}`,
      );

      return variant;
    } catch (error) {
      this.logger.error(
        `[CDNImageProvider] failed to fetch image`,
        error instanceof Error ? error.stack : String(error),
      );

      return null;
    }
  }

  // ======================================================
  // 🧩 RESPONSIVE VARIANTS (CDN OPTIMIZED)
  // ======================================================
  async getImageVariants(
    request: ImageRequest,
  ): Promise<ImageVariant[]> {
    const baseUrl = this.buildCdnUrl(request.imageId, request);

    const variants: ImageVariant[] = [
      {
        url: `${baseUrl}?w=400&fmt=auto`,
        width: 400,
        format: 'auto',
        isOptimized: true,
        source: 'cdn',
      },
      {
        url: `${baseUrl}?w=800&fmt=auto`,
        width: 800,
        format: 'auto',
        isOptimized: true,
        source: 'cdn',
      },
      {
        url: `${baseUrl}?w=1200&fmt=auto`,
        width: 1200,
        format: 'auto',
        isOptimized: true,
        source: 'cdn',
      },
    ];

    return variants;
  }

  // ======================================================
  // ⚡ PRELOAD IMAGE (EDGE CACHE WARMING)
  // ======================================================
  async preloadImage(request: ImageRequest): Promise<void> {
    try {
      const url = this.buildCdnUrl(request.imageId, request);

      // In real system:
      // - trigger CDN prefetch / cache warmup API
      // - or make HEAD request to edge node

      this.logger.debug(
        `[CDNImageProvider] preload triggered ${url}`,
      );
    } catch (error) {
      this.logger.error(
        `[CDNImageProvider] preload failed`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // ======================================================
  // 🔍 CHECK IMAGE AVAILABILITY (CDN LEVEL)
  // ======================================================
  async exists(imageId: string): Promise<boolean> {
    try {
      // In real system:
      // - CDN HEAD request
      // - or origin fallback check

      const exists = true; // placeholder

      this.logger.debug(
        `[CDNImageProvider] exists check ${imageId}`,
      );

      return exists;
    } catch (error) {
      this.logger.error(
        `[CDNImageProvider] exists check failed`,
        error instanceof Error ? error.stack : String(error),
      );

      return false;
    }
  }

  // ======================================================
  // 🔧 INTERNAL: BUILD CDN URL
  // ======================================================
  private buildCdnUrl(imageId: string, request: ImageRequest): string {
    const cdnDomain =
      process.env.CDN_DOMAIN || 'https://cdn.smartpage.app';

    // CDN path strategy:
    // /tenantId/imageId for cache segmentation
    const tenantPrefix = request.tenantId;

    return `${cdnDomain}/${tenantPrefix}/${imageId}`;
  }
}