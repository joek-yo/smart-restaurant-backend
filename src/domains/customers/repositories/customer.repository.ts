// src/domains/customers/repositories/customer.repository.ts

import { Customer } from '../entities/customer.entity';
import { CustomerIdVO } from '../value-objects/customer-id.vo';
import { PhoneVO } from '../value-objects/phone.vo';

/**
 * CustomerRepository (CONTRACT ONLY)
 * ----------------------------------
 * Domain-level persistence contract.
 */

export interface CustomerRepository {
  /**
   * Create new customer
   */
  create(customer: Customer): Promise<Customer>;

  /**
   * Find by ID
   */
  findById(id: CustomerIdVO): Promise<Customer | null>;

  /**
   * Find by phone
   */
  findByPhone(phone: PhoneVO): Promise<Customer | null>;

  /**
   * Update customer safely (NOT exposing domain internals)
   *
   * NOTE:
   * lastSeenAt uses `Date | null` in domain,
   * but repository accepts `Date | undefined` for Mongo safety.
   */
  update(
    id: CustomerIdVO,
    partial: {
      name?: string;
      tags?: string[];
      lastSeenAt?: Date | null;
    },
  ): Promise<Customer>;
}