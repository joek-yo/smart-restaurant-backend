// src/modules/smartpage/smartpage.module.ts

import { Module } from '@nestjs/common';

/* =====================================================
   CONTROLLERS
===================================================== */
import { SmartPageController } from './presentation/smartpage.controller';
import { SmartPageDebugController } from './presentation/smartpage.debug.controller';

/* =====================================================
   ORCHESTRATION
===================================================== */
import { SmartPageOrchestratorService } from './application/orchestration/smartpage-orchestrator.service';

/* =====================================================
   RENDERING ENGINE
===================================================== */
import { SmartPageRendererService } from './application/renderer/smartpage-renderer.service';
import { BlockRendererService } from './application/renderer/block-renderer.service';
import { ContextResolverService } from './application/renderer/context-resolver.service';
import { VisibilityEngineService } from './application/renderer/visibility-engine.service';

/* =====================================================
   CONTEXT LAYER
===================================================== */
import { SmartPageContextBuilder } from './application/context/smartpage-context.builder';
import { UserContextService } from './application/context/user-context.service';
import { BusinessContextService } from './application/context/business-context.service';

/* =====================================================
   BLOCK SERVICES
===================================================== */
import { HeroBlockService } from './application/blocks/hero-block.service';
import { CatalogBlockService } from './application/blocks/catalog-block.service';
import { ProductBlockService } from './application/blocks/product-block.service';
import { CartBlockService } from './application/blocks/cart-block.service';
import { RecommendationBlockService } from './application/blocks/recommendation-block.service';
import { CheckoutBlockService } from './application/blocks/checkout-block.service';

/* =====================================================
   AI LAYER
===================================================== */
import { IntentToSmartpageService } from './application/ai/intent-to-smartpage.service';
import { SmartpageRecommendationService } from './application/ai/smartpage-recommendation.service';
import { SmartpagePersonalizationService } from './application/ai/smartpage-personalization.service';

/* =====================================================
   IMAGE ENGINE
===================================================== */
import { ImagePolicyEngine } from './application/image-engine/image-policy.engine';
import { ImageSelectionService } from './application/image-engine/image-selection.service';
import { ImageOptimizerService } from './application/image-engine/image-optimizer.service';

/* =====================================================
   CART INTEGRATION
===================================================== */
import { CartSyncService } from './application/cart-integration/cart-sync.service';
import { CartContextMapper } from './application/cart-integration/cart-context.mapper';

/* =====================================================
   INFRASTRUCTURE
===================================================== */
import { SmartPageMongoRepository } from './infrastructure/persistence/smartpage.mongo.repository';
import { SmartPageVersionMongoRepository } from './infrastructure/persistence/smartpage-version.mongo.repository';
import { SmartPageCacheRedis } from './infrastructure/persistence/smartpage-cache.redis';

import { CatalogAdapter } from './infrastructure/adapters/catalog.adapter';
import { CheckoutAdapter } from './infrastructure/adapters/checkout.adapter';
import { SessionsAdapter } from './infrastructure/adapters/sessions.adapter';
import { ConversationAdapter } from './infrastructure/adapters/conversation.adapter';

import { S3ImageProvider } from './infrastructure/image-provider/s3-image.provider';
import { CDNImageProvider } from './infrastructure/image-provider/cdn-image.provider';

/* =====================================================
   OBSERVABILITY
===================================================== */
import { SmartpageLoggerService } from './infrastructure/observability/smartpage-logger.service';
import { SmartPageMetricsService } from './infrastructure/observability/smartpage-metrics.service';

/* =====================================================
   MODULE
===================================================== */

@Module({
  controllers: [
    SmartPageController,
    SmartPageDebugController,
  ],

  providers: [
    /* ================= ORCHESTRATOR ================= */
    SmartPageOrchestratorService,

    /* ================= RENDER ENGINE ================= */
    SmartPageRendererService,
    BlockRendererService,
    ContextResolverService,
    VisibilityEngineService,

    /* ================= CONTEXT ================= */
    SmartPageContextBuilder,
    UserContextService,
    BusinessContextService,

    /* ================= BLOCKS ================= */
    HeroBlockService,
    CatalogBlockService,
    ProductBlockService,
    CartBlockService,
    RecommendationBlockService,
    CheckoutBlockService,

    /* ================= AI ================= */
    IntentToSmartpageService,
    SmartpageRecommendationService,
    SmartpagePersonalizationService,

    /* ================= IMAGE ENGINE ================= */
    ImagePolicyEngine,
    ImageSelectionService,
    ImageOptimizerService,

    /* ================= CART ================= */
    CartSyncService,
    CartContextMapper,

    /* ================= INFRASTRUCTURE ================= */
    SmartPageMongoRepository,
    SmartPageVersionMongoRepository,
    SmartPageCacheRedis,

    CatalogAdapter,
    CheckoutAdapter,
    SessionsAdapter,
    ConversationAdapter,

    S3ImageProvider,
    CDNImageProvider,

    /* ================= OBSERVABILITY ================= */
    SmartpageLoggerService,
    SmartPageMetricsService,
  ],
})
export class SmartPageModule {}