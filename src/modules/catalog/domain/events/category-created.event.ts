// 📁 src/domains/menu/events/category-created.event.ts

export class CategoryCreatedEvent {
  constructor(
    public readonly category: any,
    public readonly businessId: string,
  ) {}
}