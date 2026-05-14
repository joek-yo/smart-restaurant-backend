// FILE: src/modules/smartpage/domain/value-objects/render-context.vo.ts

/**
 * RenderContextVO
 * ---------------------------------------------------
 * FINAL RESOLVED RENDER CONTEXT
 *
 * This is the OUTPUT of the SmartPage pipeline.
 *
 * DIFFERENCE:
 * - SmartPageContextVO = RAW platform + runtime state
 * - RenderContextVO     = PROCESSED + ENRICHED + READY FOR UI
 *
 * Used by:
 * - SmartPageRendererService
 * - BlockRendererService
 * - VisibilityEngineService (final pass)
 * - Frontend / API response layer
 */

import { SmartPageContextVO } from './smartpage-context.vo';
import { VisibilityRule } from '../enums/visibility-rule.enum';
import { ConversationState } from '@modules/conversation/domain/enums/conversation-state.enum';

// ==================================================
// 🧱 BLOCK RENDER OUTPUT
// ==================================================

export interface RenderedBlock {
  id: string;
  type: string;

  /**
   * Fully resolved content ready for UI
   */
  data: Record<string, any>;

  /**
   * Visibility rules that were evaluated
   */
  visibilityRules: VisibilityRule[];

  /**
   * Final decision after evaluation
   */
  isVisible: boolean;

  /**
   * Rendering priority (used for sorting)
   */
  priority: number;

  /**
   * Optional analytics tagging
   */
  tracking?: {
    impressionKey?: string;
    experimentId?: string;
  };
}

// ==================================================
// 🧠 RUNTIME SNAPSHOT (DEBUG / ANALYTICS)
// ==================================================

export interface RenderDebugSnapshot {
  resolvedAt: number;

  conversationState: ConversationState;

  evaluatedRules: {
    rule: VisibilityRule;
    result: boolean;
  }[];

  performanceMs?: number;

  warnings?: string[];
}

// ==================================================
// 🎯 FINAL RENDER CONTEXT
// ==================================================

export interface RenderContextProps {
  tenantId: string;
  userId: string;

  /**
   * Input context (already processed upstream)
   */
  sourceContext: SmartPageContextVO;

  /**
   * Fully rendered blocks (FINAL OUTPUT)
   */
  blocks: RenderedBlock[];

  /**
   * Page-level metadata
   */
  meta: {
    pageId?: string;
    version?: string;
    variant?: string;

    isPersonalized: boolean;
    isAIGenerated: boolean;
  };

  /**
   * Feature flags resolved at render time
   */
  features: Record<string, boolean>;

  /**
   * Optional debugging snapshot (dev mode)
   */
  debug?: RenderDebugSnapshot;
}

export class RenderContextVO {
  public readonly tenantId: string;
  public readonly userId: string;

  public readonly sourceContext: SmartPageContextVO;

  public readonly blocks: RenderedBlock[];

  public readonly meta: RenderContextProps['meta'];

  public readonly features: Record<string, boolean>;

  public readonly debug?: RenderDebugSnapshot;

  constructor(props: RenderContextProps) {
    this.tenantId = props.tenantId;
    this.userId = props.userId;

    this.sourceContext = props.sourceContext;

    this.blocks = Object.freeze(props.blocks.map(b => ({ ...b })));

    this.meta = Object.freeze({ ...props.meta });

    this.features = Object.freeze({ ...props.features });

    this.debug = props.debug;
  }

  // ==================================================
  // 🧠 DERIVED HELPERS
  // ==================================================

  get visibleBlocks(): RenderedBlock[] {
    return this.blocks.filter(b => b.isVisible);
  }

  get hasPersonalization(): boolean {
    return this.meta.isPersonalized;
  }

  get hasAI(): boolean {
    return this.meta.isAIGenerated;
  }

  get blockCount(): number {
    return this.blocks.length;
  }

  get visibleCount(): number {
    return this.visibleBlocks.length;
  }

  // ==================================================
  // 🔍 DEBUG HELPERS
  // ==================================================

  getRuleResults(rule: VisibilityRule): boolean[] {
    if (!this.debug?.evaluatedRules) return [];

    return this.debug.evaluatedRules
      .filter(r => r.rule === rule)
      .map(r => r.result);
  }
}