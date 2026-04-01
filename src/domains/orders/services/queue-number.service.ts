// src/domains/orders/services/queue-number.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter } from '../schemas/counter.schema';

@Injectable()
export class QueueNumberService {
  constructor(
    @InjectModel(Counter.name)
    private readonly counterModel: Model<Counter>,
  ) {}

  /**
   * Generates a thread-safe, atomic queue number.
   * Supports per-branch sequences if branchId is provided.
   */
  async generate(businessId: string, branchId?: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create a unique key for the counter: 
    // Either "businessId" or "businessId_branchId"
    const counterKey = branchId ? `${businessId}_${branchId}` : businessId;

    const counter = await this.counterModel.findOneAndUpdate(
      { 
        tenantId: counterKey, 
        lastResetDate: { $gte: today } 
      },
      { 
        $inc: { seq: 1 },
        $setOnInsert: { 
          tenantId: counterKey, // Ensure the key is set on first creation
          lastResetDate: new Date() 
        } 
      },
      {
        new: true,     
        upsert: true,  
        setDefaultsOnInsert: true
      },
    );

    return counter.seq;
  }

  /**
   * Resets the counter for a specific business or branch manually.
   */
  async resetCounter(businessId: string, branchId?: string): Promise<void> {
    const counterKey = branchId ? `${businessId}_${branchId}` : businessId;
    await this.counterModel.updateOne(
      { tenantId: counterKey },
      { $set: { seq: 0, lastResetDate: new Date() } }
    );
  }
}