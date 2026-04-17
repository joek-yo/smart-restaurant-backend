import { BusinessCustomer } from '../entities/business-customer.entity';
import { BusinessCustomerIdVO } from '../value-objects/business-customer-id.vo';
import { CustomerIdVO } from '../value-objects/customer-id.vo';

/**
 * BusinessCustomerRepository (CONTRACT ONLY)
 * ------------------------------------------
 * Handles persistence for the link between a Customer and a Business.
 */
export interface BusinessCustomerRepository {
  /**
   * Create a new business-customer link
   */
  create(entity: BusinessCustomer): Promise<BusinessCustomer>;

  /**
   * Find by unique ID
   */
  findById(id: BusinessCustomerIdVO): Promise<BusinessCustomer | null>;

  /**
   * Multi-tenant lookup (core method)
   */
  findByCustomerAndBusiness(
    customerId: CustomerIdVO,
    businessId: string,
  ): Promise<BusinessCustomer | null>;

  /**
   * Update full entity (NOT partial)
   *
   * WHY:
   * - Domain entities are not DTOs
   * - They contain behavior + invariants
   * - Partial updates break consistency in DDD
   */
  update(entity: BusinessCustomer): Promise<BusinessCustomer>;
}