// FILE: src/modules/protection/infrastructure/persistence/recovery-session.mongo.repository.ts

import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { RecoverySessionRepository } from '../../../domain/repositories/recovery-session.repository';
import { RecoverySessionEntity } from '../../../domain/entities/recovery-session.entity';

/**
 * RecoverySessionMongoRepository
 * ---------------------------------------------------------
 * MongoDB persistence layer for recovery session execution history.
 *
 * Responsibilities:
 * - store recovery attempts
 * - retrieve session recovery history
 * - track success/failure patterns
 * - enable debugging + analytics for recovery engine
 */

export type RecoverySessionDocument = RecoverySessionEntity & Document;

@Injectable()
export class RecoverySessionMongoRepository
  implements RecoverySessionRepository
{
  constructor(
    @InjectModel('RecoverySession')
    private readonly model: Model<RecoverySessionDocument>,
  ) {}

  // ==================================================
  // 💾 CREATE
  // ==================================================

  async create(session: RecoverySessionEntity): Promise<void> {
    await this.model.create(session);
  }

  // ==================================================
  // 🔍 FIND BY ID
  // ==================================================

  async findById(id: string): Promise<RecoverySessionEntity | null> {
    return this.model.findOne({ id }).lean<RecoverySessionEntity>().exec();
  }

  // ==================================================
  // 🔍 FIND BY WORKFLOW
  // ==================================================

  async findByWorkflow(
    tenantId: string,
    workflowId: string,
  ): Promise<RecoverySessionEntity[]> {
    return this.model
      .find({ tenantId, workflowId })
      .sort({ createdAt: -1 })
      .lean<RecoverySessionEntity[]>()
      .exec();
  }

  // ==================================================
  // 🔍 FIND BY USER
  // ==================================================

  async findByUser(
    tenantId: string,
    userId: string,
  ): Promise<RecoverySessionEntity[]> {
    return this.model
      .find({ tenantId, userId })
      .sort({ createdAt: -1 })
      .lean<RecoverySessionEntity[]>()
      .exec();
  }

  // ==================================================
  // 📊 UPDATE STATUS
  // ==================================================

  async updateStatus(
    id: string,
    status: 'success' | 'failed' | 'partial',
  ): Promise<void> {
    await this.model.updateOne({ id }, { $set: { status } }).exec();
  }

  // ==================================================
  // 🧹 DELETE (OPTIONAL CLEANUP)
  // ==================================================

  async deleteById(id: string): Promise<void> {
    await this.model.deleteOne({ id }).exec();
  }
}