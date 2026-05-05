// 📁 src/domains/menu/events/product-deleted.event.ts

export class ProductDeletedEvent {
  constructor(
    public readonly productId: string,
  ) {}
}