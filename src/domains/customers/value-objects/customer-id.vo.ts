// src/domains/customers/value-objects/customer-id.vo.ts

import { randomUUID } from 'crypto';

/**
 * CustomerId Value Object
 * -----------------------
 * Immutable UUID wrapper for Customer identity.
 */

export class CustomerIdVO {
  private readonly value: string;

  constructor(id?: string) {
    if (id) {
      if (!CustomerIdVO.isValid(id)) {
        throw new Error(`Invalid CustomerId format: ${id}`);
      }
      this.value = id;
    } else {
      this.value = CustomerIdVO.generate();
    }
  }

  /**
   * Create from raw string (explicit factory style)
   */
  static fromString(id: string): CustomerIdVO {
    return new CustomerIdVO(id);
  }

  /**
   * Generate new UUID v4
   */
  static generate(): string {
    return randomUUID();
  }

  /**
   * Validate UUID format
   */
  static isValid(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return uuidRegex.test(id);
  }

  /**
   * Get raw value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Equality check
   */
  equals(other: CustomerIdVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}