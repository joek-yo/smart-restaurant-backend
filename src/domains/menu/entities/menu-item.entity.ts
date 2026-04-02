// 📁 Path: src/domains/menu/entities/menu-item.entity.ts

import { BaseEntity } from '../../../common/base.entity';
import { MenuItemStatus } from '../enums/menu-item-status.enum';
import { MenuOption } from './menu-option.entity';

/**
 * Represents a MenuItem (dish/product) in the system.
 * Fully domain-driven with encapsulated behavior for updates and options.
 */
export class MenuItem extends BaseEntity {
  /** DB-assigned ID (optional) */
  id?: string;

  /** Mandatory fields */
  businessId!: string;
  name!: string;
  categoryId!: string;
  price!: number;

  /** Optional fields */
  description?: string;
  status: MenuItemStatus = MenuItemStatus.ACTIVE;
  options: MenuOption[] = [];

  constructor(partial?: Partial<MenuItem>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }

  /** Updates the menu item price */
  updatePrice(newPrice: number) {
    this.price = newPrice;
    this.touch();
  }

  /** Updates the menu item status */
  updateStatus(newStatus: MenuItemStatus) {
    this.status = newStatus;
    this.touch();
  }

  /** Updates name or description */
  updateDetails(name?: string, description?: string) {
    if (name) this.name = name;
    if (description) this.description = description;
    this.touch();
  }

  /** Adds a new option to the menu item */
  addOption(option: MenuOption) {
    this.options.push(option);
    this.touch();
  }

  /** Updates all options at once */
  updateOptions(options: MenuOption[]) {
    this.options = options;
    this.touch();
  }

  /** Removes an option by id */
  removeOption(optionId: string) {
    this.options = this.options.filter(opt => opt.id !== optionId);
    this.touch();
  }
}