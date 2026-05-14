// FILE: src/modules/smartpage/application/cart-integration/cart-sync.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { SmartPageRuntimeEntity } from '../../domain/entities/smartpage-runtime.entity';
import { SmartPageContextVO } from '../../domain/value-objects/smartpage-context.vo';

import { CartContextMapper } from './cart-context.mapper';
// import { SmartPageRendererService } from '../orchestration/smartpage-renderer.service'; // missing file

/**
 * CartSyncService
 * ----------------
 * Keeps SmartPage runtime in sync with cart/session changes.
 *
 * Responsibilities:
 * - React to cart updates in real-time
 * - Re-map session → SmartPage context
 * - Trigger partial or full re-render
 * - Ensure UI consistency across cart mutations
 *
 * This is a REAL-TIME UX bridge between:
 * SessionEngine → SmartPageRenderer
 */
@Injectable()
export class CartSyncService {
  private readonly logger = new Logger(CartSyncService.name);

  constructor(
    private readonly cartMapper: CartContextMapper,
    private readonly renderer: any,
  ) {}

  /**
   * Sync cart changes → SmartPage update
   */
  async sync(
    session: any,
    baseContext: SmartPageContextVO,
  ): Promise<SmartPageRuntimeEntity | null> {
    this.logger.log(
      `[CartSync] syncing cart update sessionId=${session?.id}`,
    );

    // ======================================================
    // 1. MAP SESSION → CART CONTEXT
    // ======================================================
    const cartContext = this.cartMapper.map(session);

    if (!cartContext?.cart) {
      this.logger.warn('[CartSync] empty cart context, skipping sync');
      return null;
    }

    // ======================================================
    // 2. MERGE INTO SMARTPAGE CONTEXT
    // ======================================================
    const updatedContext = {
      ...baseContext,
      ...cartContext,
      hasCart: !!(cartContext as any)?.session?.hasCart || !!(baseContext as any)?.hasCart,
    } as SmartPageContextVO;

    // ======================================================
    // 3. TRIGGER RE-RENDER PIPELINE
    // ======================================================
    const runtime: SmartPageRuntimeEntity =
      await this.renderer.render(updatedContext);

    // ======================================================
    // 4. LOG REAL-TIME UPDATE
    // ======================================================
    this.logger.log(
      `[CartSync] SmartPage re-rendered tenant=${baseContext.tenantId} user=${baseContext.userId}`,
    );

    return runtime;
  }
}