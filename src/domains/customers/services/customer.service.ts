// src/domains/customers/services/customer.service.ts

import { Injectable, Inject } from '@nestjs/common';

import {
  CUSTOMER_REPOSITORY,
  BUSINESS_CUSTOMER_REPOSITORY,
} from '../repositories/customer.tokens';

import { CustomerRepository } from '../repositories/customer.repository';
import { BusinessCustomerRepository } from '../repositories/business-customer.repository';

import { PhoneVO } from '../value-objects/phone.vo';
import { CustomerIdVO } from '../value-objects/customer-id.vo';

import { Customer } from '../entities/customer.entity';
import { BusinessCustomer } from '../entities/business-customer.entity';

import { CustomerCreatedEvent } from '../events/customer-created.event';

@Injectable()
export class CustomerService {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: CustomerRepository,

    @Inject(BUSINESS_CUSTOMER_REPOSITORY)
    private readonly businessCustomerRepo: BusinessCustomerRepository,
  ) {}

  // -----------------------------
  // MAIN ENTRY POINT
  // -----------------------------
  async getOrCreateCustomer(params: {
    businessId: string;
    phone: string;
    name?: string;
  }): Promise<Customer> {
    const phoneVO = new PhoneVO(params.phone);

    let customer = await this.customerRepo.findByPhone(phoneVO);

    // -----------------------------
    // EXISTING CUSTOMER FLOW
    // -----------------------------
    if (customer) {
      customer.markSeen();

      await this.customerRepo.update(customer.getId(), {
        // FIX: ensure null-safe value
        lastSeenAt: customer.getLastSeenAt() ?? undefined,
      });

      await this.ensureBusinessLink(params.businessId, customer.getId());

      return customer;
    }

    // -----------------------------
    // NEW CUSTOMER FLOW
    // -----------------------------
    customer = Customer.create({
      id: new CustomerIdVO(),
      phone: phoneVO,
      name: params.name ?? null,
    });

    const savedCustomer = await this.customerRepo.create(customer);

    await this.ensureBusinessLink(params.businessId, savedCustomer.getId());

    this.emitCustomerCreated(savedCustomer);

    return savedCustomer;
  }

  // -----------------------------
  // BUSINESS LINKING (MULTI-TENANT CORE)
  // -----------------------------
  private async ensureBusinessLink(
    businessId: string,
    customerId: CustomerIdVO,
  ): Promise<void> {
    const existingLink =
      await this.businessCustomerRepo.findByCustomerAndBusiness(
        customerId,
        businessId,
      );

    if (existingLink) return;

    const businessCustomer = BusinessCustomer.create({
      businessId,
      customerId,
    });

    await this.businessCustomerRepo.create(businessCustomer);
  }

  // -----------------------------
  // DOMAIN EVENT
  // -----------------------------
  private emitCustomerCreated(customer: Customer): void {
    const event = new CustomerCreatedEvent({
      id: customer.getId().getValue(),
      phone: customer.getPhone().getValue(),
      name: customer.getName(),
      createdAt: customer.getCreatedAt(),
    });

    console.log('[EVENT EMITTED]', event);
  }
}