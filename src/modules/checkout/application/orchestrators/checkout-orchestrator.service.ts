// FILE: src/modules/checkout/application/orchestrators/checkout-orchestrator.service.ts
// PURPOSE: Canonical checkout workflow brain (NO BUSINESS OWNERSHIP OF ORDERS)

import { Injectable, Logger, Inject } from '@nestjs/common';

import { EventBus } from '@core/events/event.bus';
import { CHECKOUT_EVENTS, ORDER_EVENTS } from '@core/events/event.constants';

import {
  CheckoutSessionPort,
  CHECKOUT_SESSION_PORT,
} from '../ports/checkout-session.port';

// ─────────────────────────────────────────────
// Use Cases
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

export interface CommerceContext {
  userId: string;
  tenantId: string;
  branchId?: string;
  channel: string;
  sessionId?: string;
}

@Injectable()
export class CheckoutOrchestratorService {
  private readonly logger = new Logger(
    CheckoutOrchestratorService.name,
  );

  constructor(
    // Cart
    private readonly addItemUC: AddItemToCartUseCase,
    private readonly removeItemUC: RemoveItemFromCartUseCase,
    private readonly updateQtyUC: UpdateCartQuantityUseCase,
    private readonly clearCartUC: ClearCartUseCase,

    // Checkout flow
    private readonly startCheckoutUC: StartCheckoutUseCase,
    private readonly validateCheckoutUC: ValidateCheckoutUseCase,
    private readonly summaryUC: GenerateCheckoutSummaryUseCase,
    private readonly confirmCheckoutUC: ConfirmCheckoutUseCase,
    private readonly cancelCheckoutUC: CancelCheckoutUseCase,

    // Order bridging (READ-ONLY HANDOFF)
    private readonly createOrderUC: CreateOrderFromCheckoutUseCase,

    @Inject(CHECKOUT_SESSION_PORT)
    private readonly sessionPort: CheckoutSessionPort,

    private readonly eventBus: EventBus,
  ) {}

  // ─────────────────────────────────────────────
  // 🛒 CART OPERATIONS (SESSION OWNED)
  // ─────────────────────────────────────────────

  async addToCart(
    ctx: CommerceContext,
    item: {
      productId: string;
      name: string;
      price: number;
      quantity: number;
    },
  ) {
    this.logger.log(
      `[Cart] add user=${ctx.userId} tenant=${ctx.tenantId}`,
    );

    return this.addItemUC.execute({ ...ctx, ...item });
  }

  async removeFromCart(
    ctx: CommerceContext,
    productId: string,
  ) {
    this.logger.log(`[Cart] remove user=${ctx.userId}`);

    return this.removeItemUC.execute({
      ...ctx,
      productId,
    });
  }

  async updateCartQuantity(
    ctx: CommerceContext,
    productId: string,
    quantity: number,
  ) {
    return this.updateQtyUC.execute({
      ...ctx,
      productId,
      quantity,
    });
  }

  async clearCart(ctx: CommerceContext) {
    return this.clearCartUC.execute(ctx);
  }

  // ─────────────────────────────────────────────
  // 🚀 CHECKOUT FLOW (WORKFLOW ONLY)
  // ─────────────────────────────────────────────

  async startCheckout(ctx: CommerceContext) {
    this.logger.log(
      `[Checkout] start user=${ctx.userId}`,
    );

    await this.validateCheckoutUC.execute(ctx);

    const session =
      await this.startCheckoutUC.execute(ctx);

    // ONLY checkout lifecycle event
    this.eventBus.emit(
      CHECKOUT_EVENTS.CHECKOUT_STARTED,
      {
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        channel: ctx.channel,
        sessionId: session.sessionId,
      },
    );

    return session;
  }

  async getCheckoutSummary(ctx: CommerceContext) {
    return this.summaryUC.execute(ctx);
  }

  // ─────────────────────────────────────────────
  // 💳 FINALIZATION (STATE TRANSITION ONLY)
  // ─────────────────────────────────────────────

  async confirmCheckout(ctx: CommerceContext) {
    this.logger.log(
      `[Checkout] confirm user=${ctx.userId}`,
    );

    const result =
      await this.confirmCheckoutUC.execute(ctx);

    // ⚠️ DO NOT emit ORDER_CREATED here anymore
    // Order system owns its own lifecycle via events

    this.eventBus.emit(
      CHECKOUT_EVENTS.CHECKOUT_CONFIRMED,
      {
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        channel: ctx.channel,
        orderId: result.orderId,
      },
    );

    return result;
  }

  async cancelCheckout(ctx: CommerceContext) {
    this.logger.log(
      `[Checkout] cancel user=${ctx.userId}`,
    );

    await this.cancelCheckoutUC.execute(ctx);

    this.eventBus.emit(
      CHECKOUT_EVENTS.CHECKOUT_CANCELLED,
      {
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        channel: ctx.channel,
      },
    );
  }

  // ─────────────────────────────────────────────
  // 🔥 ORDER BRIDGE (READ-ONLY HANDOFF)
  // ─────────────────────────────────────────────

  async createOrderFromCheckout(
    ctx: CommerceContext,
  ) {
    this.logger.log(
      `[Order] bridge user=${ctx.userId}`,
    );

    const session =
      await this.sessionPort.getOrCreate(
        ctx.userId,
        ctx.tenantId,
        ctx.branchId,
      );

    // PURE HANDOFF — no orchestration responsibility
    return this.createOrderUC.execute(session);
  }
}