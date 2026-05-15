// FILE: src/modules/truth-engine/infrastructure/events/truth-event.subscriber.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@core/events';
import {
  BUSINESS_EVENTS,
  CATALOG_EVENTS,
  SESSION_EVENTS,
  ORDER_EVENTS,
} from '@core/events';

import { TruthCacheService } from '../cache/truth-cache.service';

/**
 * TruthEventSubscriber
 * ---------------------
 * Event-driven consistency layer for Truth Engine.
 *
 * Responsibilities:
 * - Listen to domain events from EventBus
 * - Invalidate affected TruthSnapshot caches
 * - Ensure eventual consistency across system
 * - Optionally trigger future snapshot rebuilds
 *
 * IMPORTANT RULES:
 * - NO business logic
 * - NO snapshot computation
 * - ONLY cache invalidation + routing decisions
 */
@Injectable()
export class TruthEventSubscriber implements OnModuleInit {
  private readonly logger = new Logger(TruthEventSubscriber.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly cache: TruthCacheService,
  ) {}

  onModuleInit() {
    // ===============================
    // BUSINESS EVENTS
    // ===============================
    this.eventBus.on(BUSINESS_EVENTS.BUSINESS_UPDATED, (payload) => {
      this.handleTenantWideInvalidation(payload.businessId);
    });

    // ===============================
    // CATALOG EVENTS
    // ===============================
    this.eventBus.on(CATALOG_EVENTS.PRODUCT_CREATED, (payload) => {
      this.handleTenantWideInvalidation(payload.businessId);
    });

    this.eventBus.on(CATALOG_EVENTS.PRODUCT_UPDATED, (payload) => {
      this.handleTenantWideInvalidation(payload.businessId);
    });

    this.eventBus.on(CATALOG_EVENTS.PRODUCT_DELETED, (payload) => {
      this.handleTenantWideInvalidation(payload.businessId);
    });

    this.eventBus.on(CATALOG_EVENTS.CATEGORY_CREATED, (payload) => {
      this.handleTenantWideInvalidation(payload.businessId);
    });

    this.eventBus.on(CATALOG_EVENTS.CATEGORY_UPDATED, (payload) => {
      this.handleTenantWideInvalidation(payload.businessId);
    });

    this.eventBus.on(CATALOG_EVENTS.CATEGORY_DELETED, (payload) => {
      this.handleTenantWideInvalidation(payload.businessId);
    });

    // ===============================
    // SESSION EVENTS
    // ===============================
    this.eventBus.on(SESSION_EVENTS.SESSION_UPDATED, (payload) => {
      this.handleSessionInvalidation(payload.tenantId, payload.sessionId);
    });

    this.eventBus.on(SESSION_EVENTS.CART_ITEM_ADDED, (payload) => {
      this.handleSessionInvalidation(payload.tenantId, payload.sessionId);
    });

    this.eventBus.on(SESSION_EVENTS.CART_ITEM_REMOVED, (payload) => {
      this.handleSessionInvalidation(payload.tenantId, payload.sessionId);
    });

    this.eventBus.on(SESSION_EVENTS.CART_CLEARED, (payload) => {
      this.handleSessionInvalidation(payload.tenantId, payload.sessionId);
    });

    // ===============================
    // ORDER EVENTS (SAFETY REFRESH)
    // ===============================
    this.eventBus.on(ORDER_EVENTS.ORDER_CREATED, (payload) => {
      this.handleTenantWideInvalidation(payload.businessId);
    });

    this.logger.log(`[TruthEventSubscriber] event listeners initialized`);
  }

  // =====================================================
  // 🔥 INVALIDATION STRATEGIES
  // =====================================================

  /**
   * Invalidate ONLY session-level snapshot
   */
  private async handleSessionInvalidation(
    tenantId: string,
    sessionId: string,
  ) {
    const key = this.cache.buildKey(tenantId, sessionId);

    this.logger.debug(
      `[TruthEngine] invalidating session snapshot ${key}`,
    );

    await this.cache.del(key);
  }

  /**
   * Invalidate ALL tenant snapshots (heavy but safe)
   */
  private async handleTenantWideInvalidation(tenantId: string) {
    const key = this.cache.buildKey(tenantId);

    this.logger.warn(
      `[TruthEngine] tenant-wide invalidation ${key}`,
    );

    await this.cache.del(key);

    // FUTURE OPTIMIZATION:
    // - queue rebuild job
    // - warm cache proactively
  }
}