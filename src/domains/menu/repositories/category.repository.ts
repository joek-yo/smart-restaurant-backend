// 📁 src/domains/menu/repositories/category.repository.ts

import { Category } from '../entities/category.entity';

export interface CategoryRepository {
  /**
   * Persist a new category
   */
  create(category: Category): Promise<Category>;

  /**
   * Find a category by its unique ID
   */
  findById(id: string): Promise<Category | null>;

  /**
   * Update an existing category by ID
   */
  update(id: string, partial: Partial<Category>): Promise<Category>;

  /**
   * Retrieve all categories
   */
  findAll(): Promise<Category[]>;
}