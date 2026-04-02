// src/domains/menu/events/category-updated.event.ts

import { Category } from '../entities/category.entity';

export class CategoryUpdatedEvent {
  constructor(public readonly category: Category) {}
}