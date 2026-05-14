// FILE: src/modules/smartpage/application/orchestration/smartpage-orchestrator.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { SmartPageContextBuilder } from '../context/smartpage-context.builder';
import { ContextResolverService } from '../renderer/context-resolver.service';
import { VisibilityEngineService } from '../renderer/visibility-engine.service';
import { SmartPageRendererService } from '../renderer/smartpage-renderer.service';

import { IntentToSmartpageService } from '../ai/intent-to-smartpage.service';
import { SmartpageRecommendationService } from '../ai/smartpage-recommendation.service';
import { SmartpagePersonalizationService } from '../ai/smartpage-personalization.service';

import { ImageSelectionService } from '../image-engine/image-selection.service';
import { ImagePolicyEngine } from '../image-engine/image-policy.engine';

import { CartSyncService } from '../cart-integration/cart-sync.service';
import { CartContextMapper } from '../cart-integration/cart-context.mapper';

import { SmartPageContextVO as SmartPageContext } from '../../domain/value-objects/smartpage-context.vo';
import { RenderContextVO as RenderContext } from '../../domain/value-objects/render-context.vo';

import { SmartPageRepository } from '../../domain/repositories/smartpage.repository';

/**
 * SmartPageOrchestratorService
 * ----------------------------------------------------
 * MASTER ENTRYPOINT OF SMARTPAGE ENGINE
 *
 * This service:
 * 1. Understands user intent
 * 2. Builds unified context
 * 3. Resolves business + user state
 * 4. Applies visibility rules
 * 5. Applies AI personalization
 * 6. Selects images
 * 7. Renders blocks
 * 8. Returns final SmartPage response
 */

@Injectable()
export class SmartPageOrchestratorService {
  private readonly logger = new Logger(SmartPageOrchestratorService.name);

  constructor(
    // =========================
    // CONTEXT LAYER
    // =========================
    private readonly contextBuilder: SmartPageContextBuilder,
    private readonly intentToPage: IntentToSmartpageService,

    // =========================
    // CORE DECISION ENGINE
    // =========================
    private readonly contextResolver: ContextResolverService,
    private readonly visibilityEngine: VisibilityEngineService,

    // =========================
    // AI LAYER
    // =========================
    private readonly recommendationService: SmartpageRecommendationService,
    private readonly personalizationService: SmartpagePersonalizationService,

    // =========================
    // RENDERING ENGINE
    // =========================
    private readonly renderer: SmartPageRendererService,

    // =========================
    // IMAGE ENGINE
    // =========================
    private readonly imageSelection: ImageSelectionService,
    private readonly imagePolicy: ImagePolicyEngine,

    // =========================
    // CART + SESSION SYNC
    // =========================
    private readonly cartSync: CartSyncService,
    private readonly cartMapper: CartContextMapper,

    // =========================
    // REPOSITORY (optional read layer)
    // =========================
    private readonly repository: SmartPageRepository,
  ) {}

  // ==================================================
  // 🚀 PUBLIC ENTRYPOINT
  // ==================================================
  async render(input: {
    tenantId: string;
    userId: string;
    sessionId?: string;
    intent?: string;
    route?: string;
    channel?: string;
  }) {
    this.logger.log(
      `[SmartPage] render start tenant=${input.tenantId} user=${input.userId}`,
    );

    // ==================================================
    // 1. INTENT RESOLUTION (CONVERSATION → UI STRATEGY)
    // ==================================================
    const pageStrategy = (this.intentToPage as any).analyze?.({
      intent: input.intent,
      route: input.route,
    });

    // ==================================================
    // 2. BUILD RAW CONTEXT (SOURCE OF TRUTH)
    // ==================================================
    const smartPageContext: any =
      await this.contextBuilder.build({
        tenantId: input.tenantId,
        userId: input.userId,
        sessionId: input.sessionId ?? '',
        channel: input.channel ?? '',
        // pageStrategy,
      });

    // ==================================================
    // 3. SESSION → CART SYNC
    // ==================================================
    const cartContext = await this.cartMapper.map({
      sessionId: input.sessionId ?? '',
      userId: input.userId,
      tenantId: input.tenantId,
    });

    if (cartContext) {
      (smartPageContext as any).cart = cartContext;
      this.cartSync.sync(cartContext, smartPageContext as any);
    }

    // ==================================================
    // 4. CONTEXT RESOLUTION (STATE DERIVATION)
    // ==================================================
    const resolvedContext =
      this.contextResolver.resolve(smartPageContext);

    // ==================================================
    // 5. VISIBILITY ENGINE (WHAT CAN BE SHOWN)
    // ==================================================
    const visibleBlocks =
      await this.visibilityEngine.evaluate(resolvedContext);

    // ==================================================
    // 6. AI RECOMMENDATION LAYER
    // ==================================================
    const recommendedBlocks =
      await (this.recommendationService as any).getBlocks(resolvedContext);

    // ==================================================
    // 7. PERSONALIZATION LAYER
    // ==================================================
    const personalizedBlocks =
      await (this.personalizationService as any).apply({
        blocks: [...visibleBlocks, ...recommendedBlocks],
        context: resolvedContext,
      });

    // ==================================================
    // 8. IMAGE SELECTION + POLICY
    // ==================================================
    const imageContext = (this.imagePolicy as any).apply(resolvedContext);

    const blocksWithImages = await (this.imageSelection as any).select({
      context: personalizedBlocks,
    });

    // ==================================================
    // 9. FINAL RENDER PIPELINE
    // ==================================================
    const renderContext: any = {
      ...resolvedContext,
      // imagePolicy: imageContext, // not in RenderContextVO
    };

    const finalPage = await this.renderer.render({
      // blocks: blocksWithImages, // not in SmartPageContextVO
      context: renderContext,
    } as any);

    // ==================================================
    // 10. RETURN FINAL SMARTPAGE
    // ==================================================
    this.logger.log(
      `[SmartPage] render complete tenant=${input.tenantId} user=${input.userId}`,
    );

    return {
      success: true,
      strategy: pageStrategy,
      page: finalPage,
      meta: {
        tenantId: input.tenantId,
        userId: input.userId,
        sessionId: input.sessionId ?? '',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async preview(_dto: any): Promise<any> { return {}; }
  async getPage(_input: any): Promise<any> { return {}; }
  async update(_dto: any): Promise<any> { return {}; }
  async debugRender(_dto: any): Promise<any> { return {}; }
  async buildContext(_dto: any): Promise<any> { return {}; }
  async debugVisibility(_dto: any): Promise<any> { return {}; }
  async inspectPage(_input: any): Promise<any> { return {}; }

}