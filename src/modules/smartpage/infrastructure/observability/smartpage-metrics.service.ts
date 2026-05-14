// src/modules/smartpage/infrastructure/observability/smartpage-metrics.service.ts

import { Injectable, Logger } from '@nestjs/common';

export interface SmartPageRenderMetric {
  tenantId: string;
  userId: string;
  pageId?: string;
  version?: string;
  timestamp: Date;
}

export interface BlockVisibilityMetric {
  tenantId: string;
  userId: string;
  pageId?: string;
  blockId: string;
  blockType: string;
  visible: boolean;
  reason?: string;
  timestamp: Date;
}

export interface BlockClickMetric {
  tenantId: string;
  userId: string;
  pageId?: string;
  blockId: string;
  blockType: string;
  action?: string;
  timestamp: Date;
}

export interface ConversionMetric {
  tenantId: string;
  userId: string;
  pageId?: string;
  funnelStage: 'VIEW' | 'CART' | 'CHECKOUT' | 'PURCHASE';
  value?: number;
  timestamp: Date;
}

export interface PersonalizationMetric {
  tenantId: string;
  userId: string;
  pageId?: string;
  strategy: string;
  confidence?: number;
  blocksSelected: number;
  timestamp: Date;
}

/**
 * SmartPageMetricsService
 * -----------------------------------------------------
 * Tracks all SmartPage behavioral and performance signals.
 *
 * NOTE:
 * - This is WRITE-ONLY (fire-and-forget design)
 * - Can later be swapped with Kafka / Redis Streams / BigQuery
 */
@Injectable()
export class SmartPageMetricsService {
  private readonly logger = new Logger(SmartPageMetricsService.name);

  // =====================================================
  // 📄 PAGE RENDER TRACKING
  // =====================================================
  trackRender(metric: SmartPageRenderMetric): void {
    this.logger.log(
      `[SMARTPAGE_RENDER] tenant=${metric.tenantId} user=${metric.userId} page=${metric.pageId ?? 'unknown'}`,
    );

    // TODO: emit to event bus / kafka
    // this.eventBus.emit('smartpage.rendered', metric);
  }

  // =====================================================
  // 👁 BLOCK VISIBILITY TRACKING
  // =====================================================
  trackBlockVisibility(metric: BlockVisibilityMetric): void {
    this.logger.debug(
      `[BLOCK_VISIBILITY] ${metric.blockType}:${metric.blockId} visible=${metric.visible}`,
    );

    // TODO: store visibility heatmap
    // this.eventBus.emit('smartpage.block.visibility', metric);
  }

  // =====================================================
  // 🖱 BLOCK CLICK TRACKING
  // =====================================================
  trackBlockClick(metric: BlockClickMetric): void {
    this.logger.log(
      `[BLOCK_CLICK] ${metric.blockType}:${metric.blockId} action=${metric.action ?? 'click'}`,
    );

    // TODO: funnel analytics
    // this.eventBus.emit('smartpage.block.click', metric);
  }

  // =====================================================
  // 💰 CONVERSION TRACKING
  // =====================================================
  trackConversion(metric: ConversionMetric): void {
    this.logger.warn(
      `[CONVERSION] stage=${metric.funnelStage} user=${metric.userId}`,
    );

    // TODO: connect checkout/payment engine
    // this.eventBus.emit('smartpage.conversion', metric);
  }

  // =====================================================
  // 🧠 PERSONALIZATION EFFECTIVENESS
  // =====================================================
  trackPersonalization(metric: PersonalizationMetric): void {
    this.logger.log(
      `[PERSONALIZATION] strategy=${metric.strategy} blocks=${metric.blocksSelected} confidence=${metric.confidence ?? 0}`,
    );

    // TODO: ML feedback loop later
    // this.eventBus.emit('smartpage.personalization', metric);
  }
}