// 📁 src/domains/menu/events/product-updated.event.ts

export class ProductUpdatedEvent {
  constructor(
    public readonly product: any,
    public readonly productId: string,
  ) {}
}