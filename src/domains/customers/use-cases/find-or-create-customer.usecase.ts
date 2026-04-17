// src/domains/customers/use-cases/find-or-create-customer.usecase.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { CustomerService } from '../services/customer.service';
import { Customer } from '../entities/customer.entity';

/**
 * FindOrCreateCustomerUseCase
 * ---------------------------
 * Application layer entry point for customer creation/fetching.
 *
 * RESPONSIBILITY:
 * - Validate business rules (light)
 * - Delegate domain logic to service
 */

@Injectable()
export class FindOrCreateCustomerUseCase {
  constructor(
    private readonly customerService: CustomerService,
  ) {}

  /**
   * Execute use-case
   */
  async execute(input: {
    businessId: string;
    phone: string;
    name?: string;
  }): Promise<Customer> {
    // -----------------------------
    // INPUT VALIDATION (use-case level safety)
    // -----------------------------
    if (!input) {
      throw new BadRequestException('Input is required');
    }

    if (!input.businessId?.trim()) {
      throw new BadRequestException('businessId is required');
    }

    if (!input.phone?.trim()) {
      throw new BadRequestException('phone is required');
    }

    // -----------------------------
    // DELEGATE TO DOMAIN SERVICE
    // -----------------------------
    return this.customerService.getOrCreateCustomer({
      businessId: input.businessId.trim(),
      phone: input.phone.trim(),
      name: input.name?.trim(),
    });
  }
}