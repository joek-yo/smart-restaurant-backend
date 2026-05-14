// FILE: src/modules/smartpage/application/orchestration/smartpage-renderer.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { SmartPageContextVO } from '../../domain/value-objects/smartpage-context.vo';
import { RenderContextVO } from '../../domain/value-objects/render-context.vo';

import { VisibilityEngineService } from '../renderer/visibility-engine.service';
import { ContextResolverService } from '../renderer/context-resolver.service';
import { BlockRendererService } from '../renderer/block-renderer.service';
import { ImageSelectionService } from '../image-engine/image-selection.service';

import { SmartPageRepository } from '../../domain/repositories/smartpage.repository';

import { SmartPageRuntimeEntity } from '../../domain/entities/smartpage-runtime.entity';
import { SmartPageEntity } from '../../domain/entities/smartpage.entity';

@Injectable()
export class SmartPageRendererService {
  private readonly logger = new Logger(SmartPageRendererService.name);

  constructor(
    private readonly smartPageRepository: SmartPageRepository,

    private readonly contextResolver: ContextResolverService,
    private readonly visibilityEngine: VisibilityEngineService,

    private readonly blockRenderer: BlockRendererService,
    private readonly imageSelection: ImageSelectionService,
  ) {}

  /**
   * =========================================================
   * 🚀 MASTER RENDER PIPELINE
   * =========================================================
   */
  async render(context: SmartPageContextVO): Promise<SmartPageRuntimeEntity> {
    this.logger.log(
      `[SmartPageRenderer] start render tenant=${context.tenantId} user=${context.userId}`,
    );

    // =========================================================
    // 1. LOAD SMARTPAGE AGGREGATE
    // =========================================================
    const smartPage: SmartPageEntity =
      await this.smartPageRepository.findByContext(context);

    // =========================================================
    // 2. RESOLVE CONTEXT (derive meaning)
    // =========================================================
    const renderContext: RenderContextVO =
      this.contextResolver.resolve(context);

    // =========================================================
    // 3. APPLY VISIBILITY ENGINE (filter blocks)
    // =========================================================
    const visibleBlocks = this.visibilityEngine.filter(
      smartPage.blocks,
      renderContext,
    );

    // =========================================================
    // 4. PERSONALIZATION + IMAGE SELECTION PREPASS
    // =========================================================
    const enrichedBlocks = await Promise.all(
      visibleBlocks.map(async (block) => {
        const selectedImage =
          await this.imageSelection.select(block, renderContext);

        return {
          ...block,
          resolvedImage: selectedImage,
        };
      }),
    );

    // =========================================================
    // 5. BLOCK RENDERING (CORE UI COMPILATION)
    // =========================================================
    const renderedBlocks = await Promise.all(
      enrichedBlocks.map((block) =>
        this.blockRenderer.render(block, renderContext),
      ),
    );

    // =========================================================
    // 6. BUILD RUNTIME SNAPSHOT
    // =========================================================
    const runtime = new SmartPageRuntimeEntity({
      tenantId: context.tenantId,
      userId: context.userId,
      smartPageId: smartPage.id,

      renderedBlocks,

      contextSnapshot: renderContext,

      renderedAt: new Date(),

      metadata: {
        totalBlocks: smartPage.blocks.length,
        visibleBlocks: visibleBlocks.length,
        renderedBlocks: renderedBlocks.length,
      },
    });

    // =========================================================
    // 7. RETURN FINAL SMARTPAGE RUNTIME
    // =========================================================
    this.logger.log(
      `[SmartPageRenderer] completed tenant=${context.tenantId} user=${context.userId}`,
    );

    return runtime;
  }
}