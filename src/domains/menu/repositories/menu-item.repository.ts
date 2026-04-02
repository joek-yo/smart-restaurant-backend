// 📁 src/domains/menu/repositories/menu-item.repository.ts

import { MenuItem } from '../entities/menu-item.entity';

export interface MenuItemRepository {
  /**
   * Persist a new menu item
   */
  create(menuItem: MenuItem): Promise<MenuItem>;

  /**
   * Find a menu item by its unique ID
   */
  findById(id: string): Promise<MenuItem | null>;

  /**
   * Update an existing menu item by ID
   */
  update(id: string, partial: Partial<MenuItem>): Promise<MenuItem>;

  /**
   * Find all menu items under a category
   */
  findByCategory(categoryId: string): Promise<MenuItem[]>;

  /**
   * Soft-delete or remove a menu item by ID
   */
  delete(id: string): Promise<void>;
}