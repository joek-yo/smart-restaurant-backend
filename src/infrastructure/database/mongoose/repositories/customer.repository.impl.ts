// src/infrastructure/database/mongoose/repositories/customer.repository.impl.ts

import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { CustomerRepository } from '../../../../domains/customers/repositories/customer.repository';
import { Customer } from '../../../../domains/customers/entities/customer.entity';
import { PhoneVO } from '../../../../domains/customers/value-objects/phone.vo';
import { CustomerIdVO } from '../../../../domains/customers/value-objects/customer-id.vo';

/**
 * CustomerRepositoryImpl
 * ----------------------
 * MongoDB implementation of CustomerRepository contract.
 */

export class CustomerRepositoryImpl implements CustomerRepository {
  constructor(
    @InjectModel('Customer')
    private readonly customerModel: Model<any>,
  ) {}

  async create(entity: Customer): Promise<Customer> {
    const doc = await this.customerModel.create({
      _id: entity.getId().getValue(),
      phone: entity.getPhone().getValue(),
      name: entity.getName(),
      tags: entity.getTags(),
      lastSeenAt: entity.getLastSeenAt(),
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
    });

    return this.toDomain(doc);
  }

  async findById(id: CustomerIdVO): Promise<Customer | null> {
    const doc = await this.customerModel.findById(id.getValue());
    if (!doc) return null;

    return this.toDomain(doc);
  }

  async findByPhone(phone: PhoneVO): Promise<Customer | null> {
    const doc = await this.customerModel.findOne({
      phone: phone.getValue(),
    });

    if (!doc) return null;

    return this.toDomain(doc);
  }

  async update(
    id: CustomerIdVO,
    partial: {
      name?: string;
      tags?: string[];
      lastSeenAt?: Date | null;
    },
  ): Promise<Customer> {
    const updatePayload = this.mapPartial(partial);

    const doc = await this.customerModel.findByIdAndUpdate(
      id.getValue(),
      {
        $set: {
          ...updatePayload,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: 'after', // ✅ FIX (replaces deprecated { new: true })
      },
    );

    if (!doc) {
      throw new Error('Customer not found');
    }

    return this.toDomain(doc);
  }

  // -----------------------------
  // MAPPING LAYER
  // -----------------------------
  private toDomain(doc: any): Customer {
    return Customer.rehydrate({
      id: new CustomerIdVO(doc._id),
      phone: new PhoneVO(doc.phone),
      name: doc.name,
      tags: doc.tags ?? [],
      lastSeenAt: doc.lastSeenAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private mapPartial(partial: {
    name?: string;
    tags?: string[];
    lastSeenAt?: Date | null;
  }): any {
    const mapped: any = {};

    if (partial.name !== undefined) mapped.name = partial.name;
    if (partial.tags !== undefined) mapped.tags = partial.tags;

    // IMPORTANT: handle null explicitly (clear lastSeenAt)
    if (partial.lastSeenAt !== undefined) {
      mapped.lastSeenAt = partial.lastSeenAt;
    }

    return mapped;
  }
}