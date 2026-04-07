// 📁 src/domains/sessions/events/abandoned-cart-triggered.event.ts

export class AbandonedCartTriggeredEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly cartItems: Array<{ productId: string; quantity: number; price: number }>,
    public readonly timestamp: Date = new Date(),
  ) {}
}