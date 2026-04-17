import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

import { BusinessCustomerRepository } from '../../../../domains/customers/repositories/business-customer.repository';
import { BusinessCustomer } from '../../../../domains/customers/entities/business-customer.entity';
import { BusinessCustomerIdVO } from '../../../../domains/customers/value-objects/business-customer-id.vo';
import { CustomerIdVO } from '../../../../domains/customers/value-objects/customer-id.vo';

/**
 * BusinessCustomerRepositoryImpl
 * ------------------------------
 * Multi-tenant relationship repository (MongoDB)
 */
@Injectable()
export class BusinessCustomerRepositoryImpl
  implements BusinessCustomerRepository
{
  constructor(
    @InjectModel('BusinessCustomer')
    private readonly model: Model<any>,
  ) {}

  async create(entity: BusinessCustomer): Promise<BusinessCustomer> {
    const doc = await this.model.create({
      _id: entity.getId().getValue(),
      businessId: entity.getBusinessId(),
      customerId: entity.getCustomerId().getValue(),
      visitCount: entity.getVisitCount(),
      totalSpent: entity.getTotalSpent(),
      lastOrderAt: entity.getLastOrderAt(),
      isActive: entity.getIsActive(),
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
    });

    return this.toDomain(doc);
  }

  async findById(id: BusinessCustomerIdVO): Promise<BusinessCustomer | null> {
    const doc = await this.model.findById(id.getValue());
    if (!doc) return null;

    return this.toDomain(doc);
  }

  async findByCustomerAndBusiness(
    customerId: CustomerIdVO,
    businessId: string,
  ): Promise<BusinessCustomer | null> {
    const doc = await this.model.findOne({
      businessId,
      customerId: customerId.getValue(),
    });

    if (!doc) return null;

    return this.toDomain(doc);
  }

  async update(entity: BusinessCustomer): Promise<BusinessCustomer> {
    const doc = await this.model.findByIdAndUpdate(
      entity.getId().getValue(),
      {
        businessId: entity.getBusinessId(),
        customerId: entity.getCustomerId().getValue(),
        visitCount: entity.getVisitCount(),
        totalSpent: entity.getTotalSpent(),
        lastOrderAt: entity.getLastOrderAt(),
        isActive: entity.getIsActive(),
        updatedAt: entity.getUpdatedAt(),
      },
      { returnDocument: 'after' }, // FIX: replaces deprecated "new: true"
    );

    if (!doc) {
      throw new Error('BusinessCustomer not found');
    }

    return this.toDomain(doc);
  }

  private toDomain(doc: any): BusinessCustomer {
    return BusinessCustomer.create({
      businessId: doc.businessId,
      customerId: new CustomerIdVO(doc.customerId),
    });
  }
}