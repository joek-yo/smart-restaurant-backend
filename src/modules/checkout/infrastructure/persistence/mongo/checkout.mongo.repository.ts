import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CheckoutRepository } from '../../../domain/repositories/checkout.repository';
import { CheckoutSchema } from './checkout.schema';
import { CheckoutSessionEntity } from '../../../domain/entities/checkout-session.entity';
import { CartEntity } from '../../../domain/entities/cart.entity';
import { OrderDraftEntity } from '../../../domain/entities/order-draft.entity';
import { CheckoutSummaryEntity } from '../../../domain/entities/checkout-summary.entity';

@Injectable()
export class CheckoutMongoRepository extends CheckoutRepository {
  constructor(
    @InjectModel(CheckoutSchema.name)
    private readonly model: Model<CheckoutSchema>,
  ) {
    super();
  }

  async getSession(tenantId: string, userId: string): Promise<CheckoutSessionEntity | null> {
    const doc = await this.model.findOne({ tenantId, userId }).lean().exec();
    return doc as unknown as CheckoutSessionEntity | null;
  }

  async saveSession(session: CheckoutSessionEntity): Promise<CheckoutSessionEntity> {
    const id = (session as any).id;
    if (!id) {
      const created = await this.model.create(session as any);
      return created.toObject() as unknown as CheckoutSessionEntity;
    }
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: session as any }, { new: true })
      .lean()
      .exec();
    return updated as unknown as CheckoutSessionEntity;
  }

  async deleteSession(tenantId: string, userId: string): Promise<void> {
    await this.model.deleteOne({ tenantId, userId }).exec();
  }

  async saveCart(tenantId: string, userId: string, cart: CartEntity): Promise<void> {
    await this.model
      .findOneAndUpdate(
        { tenantId, userId },
        { $set: { items: (cart as any).items ?? [] } },
        { upsert: true },
      )
      .exec();
  }

  async getCart(tenantId: string, userId: string): Promise<CartEntity | null> {
    const doc = await this.model.findOne({ tenantId, userId }).lean().exec();
    return doc ? ({ items: (doc as any).items } as unknown as CartEntity) : null;
  }

  async saveDraft(draft: OrderDraftEntity): Promise<OrderDraftEntity> {
    return draft;
  }

  async getDraft(_tenantId: string, _userId: string): Promise<OrderDraftEntity | null> {
    return null;
  }

  async getSummary(_tenantId: string, _userId: string): Promise<CheckoutSummaryEntity | null> {
    return null;
  }
}
