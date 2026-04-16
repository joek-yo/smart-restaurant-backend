// 📁 Path: src/infrastructure/database/mongoose/repositories/menu-item.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { MenuItemRepository } from '../../../../domains/menu/repositories/menu-item.repository';
import { MenuItem } from '../../../../domains/menu/entities/menu-item.entity';
import { MenuOption } from '../../../../domains/menu/entities/menu-option.entity';

import {
  MenuItemModel,
  MenuItemDocument,
} from '../menu-item.schema';

@Injectable()
export class MenuItemRepositoryImpl implements MenuItemRepository {
  constructor(
    @InjectModel(MenuItemModel.name)
    private readonly menuItemModel: Model<MenuItemDocument>,
  ) {}

  /** Create a new menu item */
  async create(menuItem: MenuItem): Promise<MenuItem> {
    const created = await this.menuItemModel.create({
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      categoryId: menuItem.categoryId,
      status: menuItem.status,
      options: menuItem.options,
    });

    return this.toDomain(created);
  }

  /** Find by ID */
  async findById(id: string): Promise<MenuItem | null> {
    const doc = await this.menuItemModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  /** Find all items by category */
  async findByCategory(categoryId: string): Promise<MenuItem[]> {
    const docs = await this.menuItemModel.find({ categoryId }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  /** Update menu item */
  async update(id: string, partial: Partial<MenuItem>): Promise<MenuItem> {
    const updated = await this.menuItemModel
      .findByIdAndUpdate(id, partial, { new: true })
      .exec();

    if (!updated) {
      throw new Error('MenuItem not found');
    }

    return this.toDomain(updated);
  }

  /** Delete menu item */
  async delete(id: string): Promise<void> {
    await this.menuItemModel.findByIdAndDelete(id).exec();
  }

  /** Map Mongoose document → Domain entity */
  private toDomain(doc: MenuItemDocument): MenuItem {
    return new MenuItem({
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      price: doc.price,
      categoryId: doc.categoryId,
      status: doc.status,

      // ✅ FIX: map to domain MenuOption
      options: (doc.options || []).map(
        (opt) =>
          new MenuOption({
            name: opt.name,
            price: opt.price,
            required: false, // default (since DB doesn't store it)
            createdAt: new Date(),
            updatedAt: new Date(),
            touch: () => {},
          }),
      ),

      // ✅ FIX: cast to access timestamps
      createdAt: (doc as any).createdAt,
      updatedAt: (doc as any).updatedAt,
    });
  }
}