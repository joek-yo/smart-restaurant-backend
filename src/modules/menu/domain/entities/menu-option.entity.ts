// 📁 src/domains/menu/entities/menu-option.entity.ts

import { BaseEntity } from '@common/base.entity';

/**
 * Represents an option (addon/variant) for a MenuItem
 */
export class MenuOption extends BaseEntity {
  id?: string;

  /** Mandatory fields */
  name!: string;
  price: number = 0;

  /** Optional fields */
  description?: string;
  required: boolean = false; // whether this option is mandatory
  maxSelection?: number; // max selectable items for this option

  constructor(partial?: Partial<MenuOption>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }

  /** Update option details */
  updateDetails(name?: string, description?: string, price?: number) {
    if (name) this.name = name;
    if (description) this.description = description;
    if (price !== undefined) this.price = price;
    this.touch();
  }
}