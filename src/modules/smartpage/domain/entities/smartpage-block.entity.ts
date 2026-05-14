// FILE: src/modules/smartpage/domain/entities/smartpage-block.entity.ts

/**
 * SmartPageBlockEntity
 * ---------------------------------------------------
 * CORE RENDERING UNIT OF SMARTPAGE ENGINE
 *
 * This is the HEART of the system.
 *
 * Every UI output is composed of blocks.
 *
 * A block represents:
 * - hero section
 * - product card grid
 * - cart summary
 * - checkout CTA
 * - recommendation engine output
 * - banners / promos
 *
 * IMPORTANT:
 * - Blocks are domain objects (NOT UI components)
 * - Rendering happens later in BlockRendererService
 * - This entity defines STRUCTURE, NOT PRESENTATION
 */

import { BaseEntity } from '@common/base.entity';
import { VisibilityRule } from '../enums/visibility-rule.enum';

export type SmartPageBlockType =
  | 'HERO'
  | 'CATALOG'
  | 'PRODUCT'
  | 'CART'
  | 'CHECKOUT'
  | 'RECOMMENDATION'
  | 'BANNER'
  | 'TEXT'
  | 'FLASH_SALE'
  | 'CATEGORY'
  | 'DIVIDER';

export interface BlockStyle {
  layout?: 'grid' | 'list' | 'carousel' | 'hero' | 'stacked';

  theme?: 'light' | 'dark' | 'auto';

  padding?: string;
  margin?: string;

  backgroundColor?: string;
  textColor?: string;

  borderRadius?: string;

  shadow?: 'none' | 'sm' | 'md' | 'lg';

  customCss?: Record<string, any>;
}

export interface BlockMetadata {
  source?: 'manual' | 'ai' | 'system' | 'promotion';

  experimentId?: string;

  campaignId?: string;

  trackingKey?: string;

  createdBy?: string;

  updatedBy?: string;

  version?: number;
}

export interface SmartPageBlockProps {
  id: string;

  /**
   * Core rendering type
   */
  type: SmartPageBlockType;

  /**
   * Raw payload (domain data, NOT UI)
   * Example:
   * - product list
   * - hero content
   * - cart snapshot
   */
  payload: Record<string, any>;

  /**
   * Visibility rules (evaluated at runtime)
   */
  visibilityRules: VisibilityRule[];

  /**
   * Rendering priority (higher = first)
   */
  priority: number;

  /**
   * Styling instructions (NOT final CSS)
   */
  style?: BlockStyle;

  /**
   * Metadata for analytics, AI, experiments
   */
  metadata?: BlockMetadata;

  /**
   * Whether block is enabled
   */
  enabled?: boolean;
}

/**
 * SmartPageBlockEntity
 * Immutable domain representation of a renderable block
 */
export class SmartPageBlockEntity extends BaseEntity {
  public readonly id: string;
  public readonly type: SmartPageBlockType;
  public readonly payload: Record<string, any>;
  public readonly visibilityRules: VisibilityRule[];
  public readonly priority: number;
  public readonly style?: BlockStyle;
  public readonly metadata?: BlockMetadata;
  public readonly enabled: boolean;

  constructor(props: SmartPageBlockProps) {
    super(props as any);

    this.id = props.id;
    this.type = props.type;

    this.payload = Object.freeze({ ...props.payload });

    this.visibilityRules = Object.freeze([...(props.visibilityRules ?? [])]) as unknown as VisibilityRule[];

    this.priority = props.priority ?? 0;

    this.style = props.style ? Object.freeze({ ...props.style }) : undefined;

    this.metadata = props.metadata
      ? Object.freeze({ ...props.metadata })
      : undefined;

    this.enabled = props.enabled ?? true;
  }

  // ==================================================
  // 🧠 BLOCK BEHAVIOR HELPERS
  // ==================================================

  isVisible(): boolean {
    return this.enabled && this.visibilityRules.length > 0;
  }

  isHero(): boolean {
    return this.type === 'HERO';
  }

  isProduct(): boolean {
    return this.type === 'PRODUCT';
  }

  isCart(): boolean {
    return this.type === 'CART';
  }

  isCheckout(): boolean {
    return this.type === 'CHECKOUT';
  }

  isRecommendation(): boolean {
    return this.type === 'RECOMMENDATION';
  }

  hasAI(): boolean {
    return this.metadata?.source === 'ai';
  }

  hasExperiment(): boolean {
    return !!this.metadata?.experimentId;
  }

  getPriority(): number {
    return this.priority;
  }
}