// 📁 src/domains/menu/events/category-updated.event.ts

export class CategoryUpdatedEvent {
  constructor(
    public readonly category: any, // simplified payload (DTO-safe)
  ) {}
}