// src/modules/smartpage/presentation/smartpage.debug.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
} from '@nestjs/common';

import { SmartPageOrchestratorService } from '../application/orchestration/smartpage-orchestrator.service';
import { SmartPageRendererService } from '../application/renderer/smartpage-renderer.service';

import { RenderSmartPageDto } from './dto/render-smartpage.dto';
import { PreviewSmartPageDto } from './dto/preview-smartpage.dto';

/**
 * SmartPageDebugController
 * -----------------------------------------------------
 * INTERNAL DEBUG + DIAGNOSTIC TOOLING ONLY
 *
 * Responsibilities:
 * - inspect render pipeline output
 * - debug context resolution
 * - test visibility rules
 * - validate personalization decisions
 *
 * IMPORTANT:
 * - MUST be disabled or secured in production
 * - NEVER exposed publicly
 */
@Controller('smartpage/debug')
export class SmartPageDebugController {
  constructor(
    private readonly orchestrator: SmartPageOrchestratorService,
    private readonly renderer: SmartPageRendererService,
  ) {}

  // =====================================================
  // 🧪 FULL PIPELINE DEBUG RUN
  // =====================================================
  @Post('render')
  async debugRender(@Body() dto: RenderSmartPageDto) {
    return this.orchestrator.debugRender(dto);
  }

  // =====================================================
  // 🧠 CONTEXT INSPECTION ONLY
  // =====================================================
  @Post('context')
  async debugContext(@Body() dto: RenderSmartPageDto) {
    return this.orchestrator.buildContext(dto);
  }

  // =====================================================
  // 👁 VISIBILITY ENGINE DEBUG
  // =====================================================
  @Post('visibility')
  async debugVisibility(@Body() dto: RenderSmartPageDto) {
    return this.orchestrator.debugVisibility(dto);
  }

  // =====================================================
  // 🧱 BLOCK RENDER DEBUG
  // =====================================================
  @Post('block-render')
  async debugBlockRender(
    @Body()
    body: {
      block: any;
      context: any;
    },
  ) {
    return this.renderer.renderBlock(body.block, body.context);
  }

  // =====================================================
  // 📄 RAW PAGE INSPECTION
  // =====================================================
  @Get('page/:tenantId/:pageId')
  async inspectPage(
    @Param('tenantId') tenantId: string,
    @Param('pageId') pageId: string,
  ) {
    return this.orchestrator.inspectPage({
      tenantId,
      pageId,
    });
  }

  // =====================================================
  // 🧪 PREVIEW PIPELINE DEBUG
  // =====================================================
  @Post('preview')
  async debugPreview(@Body() dto: PreviewSmartPageDto) {
    return this.orchestrator.preview(dto);
  }
}