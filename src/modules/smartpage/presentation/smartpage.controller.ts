// src/modules/smartpage/presentation/smartpage.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
} from '@nestjs/common';

import { SmartPageRendererService } from '../application/renderer/smartpage-renderer.service';
import { SmartPageOrchestratorService } from '../application/orchestration/smartpage-orchestrator.service';

import { RenderSmartPageDto } from './dto/render-smartpage.dto';
import { PreviewSmartPageDto } from './dto/preview-smartpage.dto';
import { UpdateSmartPageDto } from './dto/update-smartpage.dto';

/**
 * SmartPageController
 * -----------------------------------------------------
 * PUBLIC ENTRY POINT for SmartPage rendering system.
 *
 * Responsibilities:
 * - Render pages for end users
 * - Provide preview mode for admins
 * - Expose basic page retrieval endpoints
 *
 * IMPORTANT:
 * - NO BUSINESS LOGIC HERE
 * - ONLY orchestration delegation
 */
@Controller('smartpage')
export class SmartPageController {
  constructor(
    private readonly renderer: SmartPageRendererService,
    private readonly orchestrator: SmartPageOrchestratorService,
  ) {}

  // =====================================================
  // 🚀 PUBLIC RENDER ENDPOINT
  // =====================================================
  @Post('render')
  async render(@Body() dto: RenderSmartPageDto) {
    return this.orchestrator.render(dto);
  }

  // =====================================================
  // 🧪 ADMIN PREVIEW ENDPOINT
  // =====================================================
  @Post('preview')
  async preview(@Body() dto: PreviewSmartPageDto) {
    return this.orchestrator.preview(dto);
  }

  // =====================================================
  // 🧱 PAGE FETCH (OPTIONAL SUPPORT)
  // =====================================================
  @Get(':tenantId/:pageId')
  async getPage(
    @Param('tenantId') tenantId: string,
    @Param('pageId') pageId: string,
    @Query('versionId') versionId?: string,
  ) {
    return this.orchestrator.getPage({
      tenantId,
      pageId,
      versionId,
    });
  }

  // =====================================================
  // ✏️ ADMIN UPDATE ENDPOINT
  // =====================================================
  @Post('update')
  async update(@Body() dto: UpdateSmartPageDto) {
    return this.orchestrator.update(dto);
  }
}