// src/modules/checkout/infrastructure/persistence/mongo/checkout.mongo.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CheckoutRepository } from '../../../domain/repositories/checkout.repository';
import { CheckoutSchema } from './checkout.schema';

/**
 * MONGO CHECKOUT REPOSITORY
 * -------------------------
 * Implements domain repository contract using MongoDB.
 * No business logic allowed here.
 */

@Injectable()
export class CheckoutMongoRepository implements CheckoutRepository {
  constructor(
    @InjectModel(CheckoutSchema.name)
    private readonly model: Model<CheckoutSchema>,
  ) {}

  async save(checkout: any): Promise<any> {
    if (!checkout.id) {
      const created = await this.model.create(checkout);
      return created;
    }

    return this.model.findByIdAndUpdate(checkout.id, checkout, {
      new: true,
    });
  }

  async findById(id: string): Promise<any> {
    return this.model.findById(id);
  }

  async findActiveByUser(userId: string): Promise<any> {
    return this.model.findOne({
      userId,
      status: { $ne: 'ORDER_CREATED' },
    });
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }
}