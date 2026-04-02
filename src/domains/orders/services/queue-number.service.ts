// src/domains/orders/services/queue-number.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CounterDocument } from '../../counters/schemas/counter.schema'; // ✅ only import the type

@Injectable()
export class QueueNumberService {
  constructor(
    @InjectModel('Counter') // ✅ use the string name of the model
    private readonly counterModel: Model<CounterDocument>,
  ) {}

  async generate(businessId: string, branchId?: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counterKey = branchId ? `${businessId}_${branchId}` : businessId;

    const counter = await this.counterModel.findOneAndUpdate(
      { name: counterKey, lastResetDate: { $gte: today } },
      {
        $inc: { seq: 1 },
        $setOnInsert: { name: counterKey, lastResetDate: new Date() },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return counter.seq;
  }

  async resetCounter(businessId: string, branchId?: string): Promise<void> {
    const counterKey = branchId ? `${businessId}_${branchId}` : businessId;
    await this.counterModel.updateOne(
      { name: counterKey },
      { $set: { seq: 0, lastResetDate: new Date() } },
    );
  }
}