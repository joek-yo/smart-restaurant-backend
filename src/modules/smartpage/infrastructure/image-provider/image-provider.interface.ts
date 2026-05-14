// src/modules/smartpage/infrastructure/image-provider/image-provider.interface.ts

/**
 * ImageProviderInterface
 * ------------------------------------------------------
 * Abstraction layer for all image sources used by SmartPage.
 *
 * Purpose:
 * - Decouple SmartPage from specific CDN or storage provider
 * - Allow swapping providers without touching business logic
 * - Support multiple image sources (S3, CDN, AI-generated, etc.)
 *
 * Examples of implementations:
 * - S3ImageProvider
 * - CDNImageProvider
 * - Future: AIImageProvider (generated images)
 */

export interface ImageVariant {
  url: string;
  width?: number;
  height?: number;
  format?: string;

  // performance metadata
  sizeBytes?: number;
  isOptimized?: boolean;

  // source tracking
  source?: string;
}

export interface ImageRequest {
  tenantId: string;
  imageId: string;

  // context for optimization decisions
  width?: number;
  height?: number;

  quality?: number;

  // usage hints
  isHero?: boolean;
  isThumbnail?: boolean;
  isProductImage?: boolean;

  // optional context signals
  userAgent?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}

export interface ImageProviderInterface {
  /**
   * Fetch best image variant for SmartPage rendering
   */
  getImage(request: ImageRequest): Promise<ImageVariant | null>;

  /**
   * Fetch multiple optimized variants (for responsive rendering)
   */
  getImageVariants(request: ImageRequest): Promise<ImageVariant[]>;

  /**
   * Preload / warm cache for performance-critical pages
   */
  preloadImage(request: ImageRequest): Promise<void>;

  /**
   * Validate image exists and is accessible
   */
  exists(imageId: string): Promise<boolean>;
}