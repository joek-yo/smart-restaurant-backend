// FILE: src/modules/smartpage/domain/entities/smartpage-runtime.entity.ts

/**
 * SmartPageRuntimeEntity
 * ---------------------------------------------------
 * ACTIVE RUNTIME RENDER INSTANCE
 *
 * This entity represents a SINGLE execution of a SmartPage render.
 *
 * It is NOT persisted as the page itself — it is a runtime snapshot used for:
 * - observability
 * - debugging
 * - personalization tracing
 * - performance tracking
 * - A/B test evaluation
 *
 * IMPORTANT:
 * This is the "black box recorder" of SmartPage rendering.
 */

import { BaseEntity } from '@common/base.entity';

export interface RuntimeImageResolution {
  originalUrl: string;
  resolvedUrl: string;
  cdn?: string;
  optimized?: boolean;
  format?: string;
}

export interface RuntimePersonalizationDecision {
  rule: string;
  result: boolean;
  reason?: string;
}

export interface RuntimeBlockSnapshot {
  blockId: string;
  type: string;

  isVisible: boolean;

  priority: number;

  /**
   * Final payload after all transformations
   */
  resolvedPayload: Record<string, any>;

  /**
   * Image resolution trace inside block
   */
  images?: RuntimeImageResolution[];
}

export interface SmartPageRuntimeProps {
  id: string;

  tenantId: string;

  userId: string;

  pageId: string;

  versionId?: string;

  /**
   * Render timing
   */
  renderStartedAt: number;

  renderCompletedAt?: number;

  /**
   * FINAL SELECTED BLOCKS
   */
  blocks: RuntimeBlockSnapshot[];

  /**
   * PERSONALIZATION DECISIONS MADE DURING RENDER
   */
  personalizationDecisions: RuntimePersonalizationDecision[];

  /**
   * FEATURE FLAGS RESOLVED AT RUNTIME
   */
  featureFlags: Record<string, boolean>;

  /**
   * ANALYTICS CONTEXT
   */
  analytics?: {
    sessionId?: string;
    channel?: string;
    device?: string;
    experimentId?: string;
  };
}

/**
 * SmartPageRuntimeEntity
 * ---------------------------------------------------
 * OBSERVABILITY + DEBUGGING CORE
 */
export class SmartPageRuntimeEntity extends BaseEntity {
  public readonly id: string;

  public readonly tenantId: string;

  public readonly userId: string;

  public readonly pageId: string;

  public readonly versionId?: string;

  public readonly renderStartedAt: number;

  public renderCompletedAt?: number;

  public readonly blocks: RuntimeBlockSnapshot[];

  public readonly personalizationDecisions: RuntimePersonalizationDecision[];

  public readonly featureFlags: Record<string, boolean>;

  public readonly analytics?: SmartPageRuntimeProps['analytics'];

  constructor(props: SmartPageRuntimeProps) {
    super(props as any);

    this.id = props.id;
    this.tenantId = props.tenantId;
    this.userId = props.userId;
    this.pageId = props.pageId;
    this.versionId = props.versionId;

    this.renderStartedAt = props.renderStartedAt;
    this.renderCompletedAt = props.renderCompletedAt;

    this.blocks = Object.freeze(props.blocks.map(b => ({ ...b, images: b.images ? [...b.images] : undefined }))) as unknown as typeof this.blocks;

    this.personalizationDecisions = Object.freeze(props.personalizationDecisions.map(d => ({ ...d }))) as unknown as typeof this.personalizationDecisions;

    this.featureFlags = Object.freeze({ ...props.featureFlags });

    this.analytics = props.analytics
      ? Object.freeze({ ...props.analytics })
      : undefined;
  }

  // ==================================================
  // ⏱ RUNTIME PERFORMANCE
  // ==================================================

  markCompleted(): void {
    this.renderCompletedAt = Date.now();
  }

  getRenderDurationMs(): number | null {
    if (!this.renderCompletedAt) return null;
    return this.renderCompletedAt - this.renderStartedAt;
  }

  // ==================================================
  // 🧠 BLOCK INSIGHTS
  // ==================================================

  getVisibleBlocks(): RuntimeBlockSnapshot[] {
    return this.blocks.filter(b => b.isVisible);
  }

  getHiddenBlocks(): RuntimeBlockSnapshot[] {
    return this.blocks.filter(b => !b.isVisible);
  }

  getBlockById(blockId: string): RuntimeBlockSnapshot | undefined {
    return this.blocks.find(b => b.blockId === blockId);
  }

  // ==================================================
  // 🎯 PERSONALIZATION INSIGHTS
  // ==================================================

  wasRuleTriggered(rule: string): boolean {
    return this.personalizationDecisions.some(d => d.rule === rule && d.result);
  }

  getTriggeredRules(): string[] {
    return this.personalizationDecisions
      .filter(d => d.result)
      .map(d => d.rule);
  }

  getRejectedRules(): string[] {
    return this.personalizationDecisions
      .filter(d => !d.result)
      .map(d => d.rule);
  }

  // ==================================================
  // 📊 ANALYTICS HELPERS
  // ==================================================

  getExperimentId(): string | undefined {
    return this.analytics?.experimentId;
  }

  getSessionId(): string | undefined {
    return this.analytics?.sessionId;
  }

  getChannel(): string | undefined {
    return this.analytics?.channel;
  }
}