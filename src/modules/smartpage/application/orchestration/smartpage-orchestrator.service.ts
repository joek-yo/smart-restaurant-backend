// FILE: src/modules/smartpage/application/orchestration/smartpage-orchestrator.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { SmartPageContextBuilder } from '../context/smartpage-context.builder';
import { ContextResolverService } from '../renderer/context-resolver.service';
import { VisibilityEngineService } from '../renderer/visibility-engine.service';
import { SmartPageRendererService } from '../renderer/smartpage-renderer.service';

import { IntentToSmartPageService } from '../ai/intent-to-smartpage.service';
import { SmartPageRecommendationService } from '../ai/smartpage-recommendation.service';
import { SmartPagePersonalizationService } from '../ai/smartpage-personalization.service';

import { ImageSelectionService } from '../image-engine/image-selection.service';
import { ImagePolicyEngine } from '../image-engine/image-policy.engine';

import { CartSyncService } from '../cart-integration/cart-sync.service';
import { CartContextMapper } from '../cart-integration/cart-context.mapper';

import { SmartPageContext } from '../../domain/value-objects/smartpage-context.vo';
import { RenderContext } from '../../domain/value-objects/render-context.vo';

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
    private readonly intentToPage: IntentToSmartPageService,

    // =========================
    // CORE DECISION ENGINE
    // =========================
    private readonly contextResolver: ContextResolverService,
    private readonly visibilityEngine: VisibilityEngineService,

    // =========================
    // AI LAYER
    // =========================
    private readonly recommendationService: SmartPageRecommendationService,
    private readonly personalizationService: SmartPagePersonalizationService,

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
    const pageStrategy = this.intentToPage.resolve({
      intent: input.intent,
      route: input.route,
    });

    // ==================================================
    // 2. BUILD RAW CONTEXT (SOURCE OF TRUTH)
    // ==================================================
    const smartPageContext: SmartPageContext =
      await this.contextBuilder.build({
        tenantId: input.tenantId,
        userId: input.userId,
        sessionId: input.sessionId,
        channel: input.channel,
        pageStrategy,
      });

    // ==================================================
    // 3. SESSION → CART SYNC
    // ==================================================
    const cartContext = await this.cartMapper.map({
      sessionId: input.sessionId,
      userId: input.userId,
      tenantId: input.tenantId,
    });

    if (cartContext) {
      smartPageContext.memory.cart = cartContext;
      this.cartSync.sync(cartContext);
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
      await this.visibilityEngine.resolve(resolvedContext);

    // ==================================================
    // 6. AI RECOMMENDATION LAYER
    // ==================================================
    const recommendedBlocks =
      await this.recommendationService.getBlocks(resolvedContext);

    // ==================================================
    // 7. PERSONALIZATION LAYER
    // ==================================================
    const personalizedBlocks =
      await this.personalizationService.apply({
        blocks: [...visibleBlocks, ...recommendedBlocks],
        context: resolvedContext,
      });

    // ==================================================
    // 8. IMAGE SELECTION + POLICY
    // ==================================================
    const imageContext = this.imagePolicy.apply(resolvedContext);

    const blocksWithImages = await this.imageSelection.select({
      blocks: personalizedBlocks,
      context: imageContext,
    });

    // ==================================================
    // 9. FINAL RENDER PIPELINE
    // ==================================================
    const renderContext: RenderContext = {
      ...resolvedContext,
      imagePolicy: imageContext,
    };

    const finalPage = await this.renderer.render({
      blocks: blocksWithImages,
      context: renderContext,
    });

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
        sessionId: input.sessionId,
        timestamp: new Date().toISOString(),
      },
    };
  }
}