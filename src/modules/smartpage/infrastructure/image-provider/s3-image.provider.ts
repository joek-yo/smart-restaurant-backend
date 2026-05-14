// src/modules/smartpage/infrastructure/image-provider/s3-image.provider.ts

import { Injectable, Logger } from '@nestjs/common';
import {
  ImageProviderInterface,
  ImageRequest,
  ImageVariant,
} from './image-provider.interface';

/**
 * S3ImageProvider
 * ------------------------------------------------------
 * Concrete implementation of ImageProviderInterface using AWS S3.
 *
 * Purpose:
 * - Fetch images stored in S3
 * - Generate optimized URLs (via CloudFront or signed URLs)
 * - Support SmartPage rendering pipeline
 *
 * NOTE:
 * This class should NOT contain business logic.
 * Only storage + retrieval logic.
 */

@Injectable()
export class S3ImageProvider implements ImageProviderInterface {
  private readonly logger = new Logger(S3ImageProvider.name);

  // In real implementation, inject AWS SDK / S3 client here
  // constructor(private readonly s3Client: S3Client) {}

  // ======================================================
  // 🖼️ GET SINGLE IMAGE
  // ======================================================
  async getImage(request: ImageRequest): Promise<ImageVariant | null> {
    try {
      const url = this.buildS3Url(request.imageId, request);

      const variant: ImageVariant = {
        url,
        width: request.width,
        height: request.height,
        format: 'jpeg',
        isOptimized: true,
        source: 's3',
      };

      this.logger.debug(
        `[S3ImageProvider] fetched image ${request.imageId}`,
      );

      return variant;
    } catch (error) {
      this.logger.error(
        `[S3ImageProvider] failed to fetch image`,
        error instanceof Error ? error.stack : String(error),
      );

      return null;
    }
  }

  // ======================================================
  // 🧩 GET IMAGE VARIANTS (RESPONSIVE SUPPORT)
  // ======================================================
  async getImageVariants(
    request: ImageRequest,
  ): Promise<ImageVariant[]> {
    const baseUrl = this.buildS3Url(request.imageId, request);

    // Simulated responsive variants (in real system: CloudFront or image processor)
    const variants: ImageVariant[] = [
      {
        url: `${baseUrl}?w=400`,
        width: 400,
        format: 'jpeg',
        isOptimized: true,
        source: 's3',
      },
      {
        url: `${baseUrl}?w=800`,
        width: 800,
        format: 'jpeg',
        isOptimized: true,
        source: 's3',
      },
      {
        url: `${baseUrl}?w=1200`,
        width: 1200,
        format: 'jpeg',
        isOptimized: true,
        source: 's3',
      },
    ];

    return variants;
  }

  // ======================================================
  // ⚡ PRELOAD IMAGE (CACHE WARMING HOOK)
  // ======================================================
  async preloadImage(request: ImageRequest): Promise<void> {
    try {
      const url = this.buildS3Url(request.imageId, request);

      // In real system:
      // - trigger CDN cache warmup
      // - or HEAD request to S3

      this.logger.debug(
        `[S3ImageProvider] preload triggered ${url}`,
      );
    } catch (error) {
      this.logger.error(
        `[S3ImageProvider] preload failed`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // ======================================================
  // 🔍 CHECK IF IMAGE EXISTS
  // ======================================================
  async exists(imageId: string): Promise<boolean> {
    try {
      // In real system:
      // - S3 HEAD request
      // - or metadata lookup

      const exists = true; // placeholder

      this.logger.debug(
        `[S3ImageProvider] exists check for ${imageId}`,
      );

      return exists;
    } catch (error) {
      this.logger.error(
        `[S3ImageProvider] exists check failed`,
        error instanceof Error ? error.stack : String(error),
      );

      return false;
    }
  }

  // ======================================================
  // 🔧 INTERNAL: BUILD S3 URL
  // ======================================================
  private buildS3Url(imageId: string, request: ImageRequest): string {
    const bucket = process.env.S3_BUCKET || 'smartpage-images';
    const region = process.env.S3_REGION || 'eu-west-1';

    // You can later swap this with CloudFront domain
    return `https://${bucket}.s3.${region}.amazonaws.com/${imageId}`;
  }
}