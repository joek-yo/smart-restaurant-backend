// FILE: src/domains/sessions/handlers/session-events.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { CartItemAddedEvent } from '../events/cart-item-added.event';
import { CartItemRemovedEvent } from '../events/cart-item-removed.event';
import { QuantityUpdatedEvent } from '../events/quantity-updated.event';
import { SessionCheckedOutEvent } from '../events/session-checked-out.event';

@Injectable()
export class SessionEventsHandler {
  private readonly logger = new Logger(SessionEventsHandler.name);

  // =========================
  // ITEM ADDED
  // =========================
  @OnEvent('session.cart-item.added')
  handleItemAdded(event: CartItemAddedEvent) {
    this.logger.log(
      `Item added → session=${event.sessionId}, product=${event.cartItem.productId}`,
    );

    // 🔥 FUTURE:
    // notify kitchen queue
    // update analytics
  }

  // =========================
  // ITEM REMOVED
  // =========================
  @OnEvent('session.cart-item.removed')
  handleItemRemoved(event: CartItemRemovedEvent) {
    this.logger.log(
      `Item removed → session=${event.sessionId}, product=${event.cartItem.productId}`,
    );
  }

  // =========================
  // QUANTITY UPDATED
  // =========================
  @OnEvent('session.cart-item.quantity-updated')
  handleQuantityUpdated(event: QuantityUpdatedEvent) {
    this.logger.log(
      `Quantity updated → session=${event.sessionId}, ${event.oldQuantity} → ${event.newQuantity}`,
    );
  }

  // =========================
  // CHECKOUT
  // =========================
  @OnEvent('session.checked-out')
  handleCheckout(event: SessionCheckedOutEvent) {
    this.logger.log(
      `Checkout → session=${event.sessionId}, total=${event.totalAmount}`,
    );

    // 🔥 FUTURE:
    // call payment service
    // send order to kitchen
    // trigger queue number
  }
}