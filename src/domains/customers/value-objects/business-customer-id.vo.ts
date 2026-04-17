// src/domains/customers/value-objects/business-customer-id.vo.ts

/**
 * BusinessCustomerId Value Object
 * --------------------------------
 * Represents the unique identity of a customer within a business context.
 *
 * IMPORTANT:
 * - This is NOT the global Customer ID
 * - This represents tenant-scoped identity mapping
 * - Used for multi-tenant customer relationships
 *
 * Rules:
 * - Immutable
 * - UUID-based
 * - Independent of database implementation
 */

import { randomUUID } from 'crypto';

export class BusinessCustomerIdVO {
  private readonly value: string;

  constructor(id?: string) {
    if (id) {
      if (!BusinessCustomerIdVO.isValid(id)) {
        throw new Error(`Invalid BusinessCustomerId format: ${id}`);
      }
      this.value = id;
    } else {
      this.value = BusinessCustomerIdVO.generate();
    }
  }

  /**
   * Generate new BusinessCustomerId
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
   * Compare two BusinessCustomer IDs
   */
  equals(other: BusinessCustomerIdVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}