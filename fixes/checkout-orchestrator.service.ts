// src/modules/checkout/application/orchestrators/checkout-orchestrator.service.ts
//
// ✅ FIX 5 — Full orchestration pipeline. Every operation carries tenantId + channel.
// Naming conflicts fixed (clearCart/startCheckout/summary were shadowing injected deps).

import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@core/events';

import { AddItemToCartUseCase } from '../use-cases/add-item-to-cart.use-case';
import { RemoveItemFromCartUseCase } from '../use-cases/remove-item-from-cart.use-case';
import { UpdateCartQuantityUseCase } from '../use-cases/update-cart-quantity.use-case';
import { ClearCartUseCase } from '../use-cases/clear-cart.use-case';
import { StartCheckoutUseCase } from '../use-cases/start-checkout.use-case';
import { ValidateCheckoutUseCase } from '../use-cases/validate-checkout.use-case';
import { GenerateCheckoutSummaryUseCase } from '../use-cases/generate-checkout-summary.use-case';
import { ConfirmCheckoutUseCase } from '../use-cases/confirm-checkout.use-case';
import { CancelCheckoutUseCase } from '../use-cases/cancel-checkout.use-case';
import { CreateOrderFromCheckoutUseCase } from '../use-cases/create-order-from-checkout.use-case';

// ── Shared context shape ───────────────────────────────────────────────────

export interface CommerceContext {
  userId: string;
  tenantId: string;
  branchId?: string;
  channel: string;
  sessionId?: string;
}

@Injectable()
export class CheckoutOrchestratorService {
  private readonly logger = new Logger(CheckoutOrchestratorService.name);

  constructor(
    // ── Cart use-cases ──────────────────────────────────────────────────
    private readonly addItemUC: AddItemToCartUseCase,
    private readonly removeItemUC: RemoveItemFromCartUseCase,
    private readonly updateQtyUC: UpdateCartQuantityUseCase,
    private readonly clearCartUC: ClearCartUseCase,

    // ── Checkout flow ───────────────────────────────────────────────────
    private readonly startCheckoutUC: StartCheckoutUseCase,
    private readonly validateCheckoutUC: ValidateCheckoutUseCase,
    private readonly summaryUC: GenerateCheckoutSummaryUseCase,
    private readonly confirmCheckoutUC: ConfirmCheckoutUseCase,
    private readonly cancelCheckoutUC: CancelCheckoutUseCase,

    // ── Order creation ───────────────────────────────────────────────────
    private readonly createOrderUC: CreateOrderFromCheckoutUseCase,

    private readonly eventBus: EventBus,
  ) {}

  // ════════════════════════════════════════════════════════════════════════
  // 🛒 CART OPERATIONS — all tenant-scoped
  // ════════════════════════════════════════════════════════════════════════

  async addToCart(
    ctx: CommerceContext,
    item: { productId: string; name: string; price: number; quantity: number },
  ) {
    this.logger.log(`[Cart] addToCart userId=${ctx.userId} tenant=${ctx.tenantId} product=${item.productId}`);
    return this.addItemUC.execute({ ...ctx, ...item });
  }

  async removeFromCart(ctx: CommerceContext, productId: string) {
    this.logger.log(`[Cart] removeFromCart userId=${ctx.userId} product=${productId}`);
    return this.removeItemUC.execute({ ...ctx, productId });
  }

  async updateCartQuantity(ctx: CommerceContext, productId: string, quantity: number) {
    return this.updateQtyUC.execute({ ...ctx, productId, quantity });
  }

  async clearCart(ctx: CommerceContext) {
    return this.clearCartUC.execute(ctx);
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🚀 CHECKOUT FLOW — ordered pipeline
  // ════════════════════════════════════════════════════════════════════════

  async startCheckout(ctx: CommerceContext) {
    this.logger.log(`[Checkout] start — userId=${ctx.userId} tenant=${ctx.tenantId}`);

    // Step 1: validate before starting
    await this.validateCheckoutUC.execute(ctx);

    // Step 2: start checkout session
    const session = await this.startCheckoutUC.execute(ctx);

    this.eventBus.emit('checkout.started', {
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      channel: ctx.channel,
      sessionId: session.sessionId,
    });

    return session;
  }

  async getCheckoutSummary(ctx: CommerceContext) {
    return this.summaryUC.execute(ctx);
  }

  // ════════════════════════════════════════════════════════════════════════
  // 💳 FINALIZATION
  // ════════════════════════════════════════════════════════════════════════

  async confirmCheckout(ctx: CommerceContext) {
    this.logger.log(`[Checkout] confirm — userId=${ctx.userId} tenant=${ctx.tenantId}`);

    const result = await this.confirmCheckoutUC.execute(ctx);

    this.eventBus.emit('checkout.confirmed', {
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      channel: ctx.channel,
      orderId: result.orderId,
    });

    return result;
  }

  async cancelCheckout(ctx: CommerceContext) {
    this.logger.log(`[Checkout] cancel — userId=${ctx.userId}`);

    const result = await this.cancelCheckoutUC.execute(ctx);

    this.eventBus.emit('checkout.cancelled', {
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      channel: ctx.channel,
    });

    return result;
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🔥 ORDER CREATION (internal — triggered by event handler)
  // ════════════════════════════════════════════════════════════════════════

  async createOrderFromCheckout(ctx: CommerceContext) {
    this.logger.log(`[Order] createFromCheckout userId=${ctx.userId} tenant=${ctx.tenantId}`);
    return this.createOrderUC.execute(ctx);
  }
}