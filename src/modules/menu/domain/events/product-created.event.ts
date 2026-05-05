// 📁 src/domains/menu/events/product-created.event.ts

export class ProductCreatedEvent {
  constructor(
    public readonly product: any,
    public readonly businessId: string,
  ) {}
}