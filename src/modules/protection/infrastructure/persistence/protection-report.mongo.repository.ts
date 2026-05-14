// FILE: src/modules/protection/infrastructure/persistence/protection-report.mongo.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ProtectionReportRepository } from '../../domain/repositories/protection-report.repository';
import { ProtectionReportEntity } from '../../domain/entities/protection-report.entity';

/**
 * ProtectionReportMongoRepository
 * ---------------------------------------------------------
 * MongoDB persistence layer for workflow protection reports.
 *
 * Responsibilities:
 * - store generated protection/health reports
 * - retrieve historical system health snapshots
 * - support audit + compliance + debugging
 * - enable analytics on system reliability
 */

export type ProtectionReportDocument = ProtectionReportEntity & Document;

@Injectable()
export class ProtectionReportMongoRepository
  implements ProtectionReportRepository
{
  constructor(
    @InjectModel('ProtectionReport')
    private readonly model: Model<ProtectionReportDocument>,
  ) {}

  // ==================================================
  // 💾 CREATE REPORT
  // ==================================================

  async create(report: ProtectionReportEntity): Promise<void> {
    await this.model.create(report);
  }

  // ==================================================
  // 🔍 FIND BY ID
  // ==================================================

  async findById(id: string): Promise<ProtectionReportEntity | null> {
    return this.model
      .findOne({ id })
      .lean<ProtectionReportEntity>()
      .exec();
  }

  // ==================================================
  // 📊 FIND BY TENANT
  // ==================================================

  async findByTenant(
    tenantId: string,
  ): Promise<ProtectionReportEntity[]> {
    return this.model
      .find({ tenantId })
      .sort({ createdAt: -1 })
      .lean<ProtectionReportEntity[]>()
      .exec();
  }

  // ==================================================
  // 📊 FIND BY WORKFLOW TYPE
  // ==================================================

  async findByWorkflowType(
    tenantId: string,
    workflowType: string,
  ): Promise<ProtectionReportEntity[]> {
    return this.model
      .find({ tenantId, workflowType })
      .sort({ createdAt: -1 })
      .lean<ProtectionReportEntity[]>()
      .exec();
  }

  // ==================================================
  // 📊 FIND LATEST REPORT
  // ==================================================

  async findLatest(
    tenantId: string,
  ): Promise<ProtectionReportEntity | null> {
    return this.model
      .findOne({ tenantId })
      .sort({ createdAt: -1 })
      .lean<ProtectionReportEntity>()
      .exec();
  }

  // ==================================================
  // 🧹 DELETE REPORT
  // ==================================================

  async deleteById(id: string): Promise<void> {
    await this.model.deleteOne({ id }).exec();
  }
}