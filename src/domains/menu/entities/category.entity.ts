// 📁 src/domains/menu/entities/category.entity.ts

import { BaseEntity } from '../../../common/base.entity';
import { CategoryStatus } from './category-status.enum';

export class Category extends BaseEntity {
  /** DB-assigned ID */
  id?: string;

  /** Mandatory fields */
  businessId!: string;
  name!: string;

  /** Optional */
  description?: string;
  status: CategoryStatus = CategoryStatus.ACTIVE;

  constructor(partial?: Partial<Category>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }

  /** Update the category name or description */
  updateDetails(name?: string, description?: string) {
    if (name) this.name = name;
    if (description) this.description = description;
    this.touch();
  }

  /** Update the category status */
  updateStatus(status: CategoryStatus) {
    this.status = status;
    this.touch();
  }
}