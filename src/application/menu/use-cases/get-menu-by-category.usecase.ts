// 📁 src/application/menu/use-cases/get-menu-by-category.usecase.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { MenuItemRepository } from '../../../domains/menu/repositories/menu-item.repository';
import { MenuItem } from '../../../domains/menu/entities/menu-item.entity';

@Injectable()
export class GetMenuByCategoryUseCase {
  constructor(private readonly menuItemRepository: MenuItemRepository) {}

  /**
   * Returns all menu items for a given category
   * @param categoryId - ID of the category
   */
  async execute(categoryId: string): Promise<MenuItem[]> {
    const items = await this.menuItemRepository.findByCategory(categoryId);

    if (!items || items.length === 0) {
      throw new NotFoundException(`No menu items found for category ${categoryId}`);
    }

    return items;
  }
}