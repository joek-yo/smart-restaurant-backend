// FILE: src/modules/smartpage/domain/value-objects/image-policy.vo.ts

/**
 * ImagePolicyVO
 * ---------------------------------------------------
 * CONTROLS ALL IMAGE RENDERING BEHAVIOR IN SMARTPAGE ENGINE
 *
 * This governs:
 * - performance optimization (lazy loading, CDN)
 * - UX behavior (blur, placeholders)
 * - fallback strategies
 * - quality/resolution selection
 *
 * Used by:
 * - ImageEngineService
 * - BlockRendererService
 * - SmartPageRendererService
 */

export type ImageFormat = 'webp' | 'jpeg' | 'png' | 'avif' | 'auto';

export type ImageCDNStrategy =
  | 'auto'
  | 'cloudfront'
  | 's3'
  | 'cloudinary'
  | 'custom';

export type ImageLoadingStrategy =
  | 'lazy'
  | 'eager'
  | 'progressive';

export interface ImagePolicyProps {
  /**
   * Enable automatic optimization (resize, compress, format switching)
   */
  optimize: boolean;

  /**
   * Blur placeholder before full image loads
   * (used for perceived performance boost)
   */
  blurPlaceholder: boolean;

  /**
   * Low-quality image preview before full load
   */
  lqip?: boolean;

  /**
   * Loading strategy
   */
  loading: ImageLoadingStrategy;

  /**
   * Preferred image format
   */
  format: ImageFormat;

  /**
   * CDN selection strategy
   */
  cdn: ImageCDNStrategy;

  /**
   * Fallback image URL if primary fails
   */
  fallbackUrl?: string;

  /**
   * Maximum width allowed for rendering
   */
  maxWidth?: number;

  /**
   * Maximum height allowed for rendering
   */
  maxHeight?: number;

  /**
   * Quality level (0–100)
   */
  quality?: number;

  /**
   * Whether to enable responsive srcsets
   */
  responsive?: boolean;

  /**
   * Whether images should be preloaded in critical blocks
   */
  preloadCritical?: boolean;
}

/**
 * ImagePolicyVO
 * Immutable runtime policy for image rendering decisions
 */
export class ImagePolicyVO {
  public readonly optimize: boolean;
  public readonly blurPlaceholder: boolean;
  public readonly lqip: boolean;
  public readonly loading: ImageLoadingStrategy;
  public readonly format: ImageFormat;
  public readonly cdn: ImageCDNStrategy;
  public readonly fallbackUrl?: string;
  public readonly maxWidth?: number;
  public readonly maxHeight?: number;
  public readonly quality?: number;
  public readonly responsive: boolean;
  public readonly preloadCritical: boolean;

  constructor(props: ImagePolicyProps) {
    this.optimize = props.optimize;
    this.blurPlaceholder = props.blurPlaceholder;
    this.lqip = props.lqip ?? true;

    this.loading = props.loading;
    this.format = props.format;
    this.cdn = props.cdn;

    this.fallbackUrl = props.fallbackUrl;

    this.maxWidth = props.maxWidth;
    this.maxHeight = props.maxHeight;

    this.quality = props.quality ?? 80;

    this.responsive = props.responsive ?? true;
    this.preloadCritical = props.preloadCritical ?? false;
  }

  // ==================================================
  // 🧠 DERIVED RULES
  // ==================================================

  shouldUseBlur(): boolean {
    return this.blurPlaceholder && this.loading === 'lazy';
  }

  shouldOptimize(): boolean {
    return this.optimize;
  }

  shouldUseLQIP(): boolean {
    return this.lqip;
  }

  isLazy(): boolean {
    return this.loading === 'lazy';
  }

  isEager(): boolean {
    return this.loading === 'eager';
  }

  isProgressive(): boolean {
    return this.loading === 'progressive';
  }

  useCDN(): boolean {
    return this.cdn !== 'custom';
  }

  hasFallback(): boolean {
    return !!this.fallbackUrl;
  }

  isResponsive(): boolean {
    return this.responsive;
  }
}