// src/modules/checkout/application/orchestrators/checkout-orchestrator.service.ts

import { Injectable } from '@nestjs/common';

// ===============================
// CART USE CASES
// ===============================
import { AddItemToCartUseCase } from '../use-cases/add-item-to-cart.use-case';
import { RemoveItemFromCartUseCase } from '../use-cases/remove-item-from-cart.use-case';
import { UpdateCartQuantityUseCase } from '../use-cases/update-cart-quantity.use-case';
import { ClearCartUseCase } from '../use-cases/clear-cart.use-case';

// ===============================
// CHECKOUT FLOW USE CASES
// ===============================
import { StartCheckoutUseCase } from '../use-cases/start-checkout.use-case';
import { ValidateCheckoutUseCase } from '../use-cases/validate-checkout.use-case';
import { GenerateCheckoutSummaryUseCase } from '../use-cases/generate-checkout-summary.use-case';
import { ConfirmCheckoutUseCase } from '../use-cases/confirm-checkout.use-case';
import { CancelCheckoutUseCase } from '../use-cases/cancel-checkout.use-case';

// ===============================
// ORDER CREATION
// ===============================
import { CreateOrderFromCheckoutUseCase } from '../use-cases/create-order-from-checkout.use-case';

// ===============================
// SERVICES (future expansion safe)
// ===============================
import { EventBus } from '@core/events';

/**
 * CheckoutOrchestratorService
 * ---------------------------
 * THE COMMERCE BRAIN
 *
 * This layer does NOT contain business logic.
 * It ONLY coordinates use-cases in correct order.
 */

@Injectable()
export class CheckoutOrchestratorService {
  constructor(
    // CART
    private readonly addItem: AddItemToCartUseCase,
    private readonly removeItem: RemoveItemFromCartUseCase,
    private readonly updateQty: UpdateCartQuantityUseCase,
    private readonly clearCart: ClearCartUseCase,

    // CHECKOUT
    private readonly startCheckout: StartCheckoutUseCase,
    private readonly validateCheckout: ValidateCheckoutUseCase,
    private readonly summary: GenerateCheckoutSummaryUseCase,
    private readonly confirmCheckout: ConfirmCheckoutUseCase,
    private readonly cancelCheckout: CancelCheckoutUseCase,

    // ORDER
    private readonly createOrder: CreateOrderFromCheckoutUseCase,

    // EVENTS
    private readonly eventBus: EventBus,
  ) {}

  // ==================================================
  // 🛒 CART OPERATIONS
  // ==================================================

  async addToCart(dto: {
    userId: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }) {
    return this.addItem.execute(dto);
  }

  async removeFromCart(dto: { userId: string; productId: string }) {
    return this.removeItem.execute(dto);
  }

  async updateCartQuantity(dto: {
    userId: string;
    productId: string;
    quantity: number;
  }) {
    return this.updateQty.execute(dto);
  }

  async clearCart(userId: string) {
    return this.clearCart.execute(userId);
  }

  // ==================================================
  // 🚀 CHECKOUT FLOW
  // ==================================================

  async startCheckout(userId: string) {
    const session = await this.startCheckout.execute({ userId });

    this.eventBus.emit('checkout.started', {
      userId,
      sessionId: session.sessionId,
    });

    return session;
  }

  async validate(userId: string) {
    return this.validateCheckout.execute({ userId });
  }

  async summary(userId: string) {
    return this.summary.execute({ userId });
  }

  // ==================================================
  // 💳 FINALIZATION
  // ==================================================

  async confirm(userId: string) {
    const result = await this.confirmCheckout.execute({ userId });

    this.eventBus.emit('checkout.confirmed', {
      userId,
      orderId: result.orderId,
    });

    return result;
  }

  async cancel(userId: string) {
    const result = await this.cancelCheckout.execute({ userId });

    this.eventBus.emit('checkout.cancelled', {
      userId,
    });

    return result;
  }

  // ==================================================
  // 🔥 DIRECT ORDER CREATION (internal safe path)
  // ==================================================

  async createOrderFromSession(session: any) {
    return this.createOrder.execute(session);
  }
}