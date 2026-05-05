// 📁 src/domains/menu/repositories/catalog-item.repository.ts

import { CatalogItem } from '../entities/catalog-item.entity';

export interface CatalogItemRepository {
  /**
   * Persist a new menu item
   */
  create(menuItem: CatalogItem): Promise<CatalogItem>;

  /**
   * Find a menu item by its unique ID
   */
  findById(id: string): Promise<CatalogItem | null>;

  /**
   * Update an existing menu item by ID
   */
  update(id: string, partial: Partial<CatalogItem>): Promise<CatalogItem>;

  /**
   * Find all menu items under a category
   */
  findByCategory(categoryId: string): Promise<CatalogItem[]>;

  /**
   * Soft-delete or remove a menu item by ID
   */
  delete(id: string): Promise<void>;
}