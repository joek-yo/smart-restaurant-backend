// src/common/base.entity.ts
export abstract class BaseEntity {
  /** Optional ID, usually assigned by DB */
  id?: string;

  /** When entity was created */
  createdAt: Date;

  /** Last updated timestamp */
  updatedAt: Date;

  constructor(partial?: Partial<BaseEntity>) {
    this.id = partial?.id; // Let DB or application assign it
    this.createdAt = partial?.createdAt || new Date();
    this.updatedAt = partial?.updatedAt || new Date();
  }

  /**
   * Update the timestamp when entity changes
   */
  touch() {
    this.updatedAt = new Date();
  }
}