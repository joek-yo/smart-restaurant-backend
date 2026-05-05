// 📁 src/domains/menu/events/category-deleted.event.ts

export class CategoryDeletedEvent {
  constructor(
    public readonly categoryId: string,
  ) {}
}