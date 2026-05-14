// FILE: src/modules/smartpage/infrastructure/persistence/smartpage.mongo.repository.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { SmartPageRepository } from '../../domain/repositories/smartpage.repository';
import { SmartPage } from '../../domain/entities/smartpage.entity';

import { SmartPageDocument } from '../schemas/smartpage.schema';

/**
 * SmartPageMongoRepository
 * -----------------------------------------------------
 * MongoDB implementation of SmartPageRepository.
 *
 * Responsibilities:
 * - Persist SmartPage aggregates
 * - Fetch by tenant / route / status
 * - Handle versioning queries
 * - Ensure domain ↔ persistence mapping
 */

@Injectable()
export class SmartPageMongoRepository implements SmartPageRepository {
  private readonly logger = new Logger(SmartPageMongoRepository.name);

  constructor(
    @InjectModel('SmartPage')
    private readonly smartPageModel: Model<SmartPageDocument>,
  ) {}

  // ==================================================
  // CREATE
  // ==================================================
  async create(page: SmartPage): Promise<SmartPage> {
    const created = await this.smartPageModel.create(page);

    this.logger.log(
      `[SmartPageRepo] created page id=${created._id}`,
    );

    return this.toDomain(created);
  }

  // ==================================================
  // FIND BY ID
  // ==================================================
  async findById(id: string): Promise<SmartPage | null> {
    const doc = await this.smartPageModel.findById(id).lean();

    if (!doc) return null;

    return this.toDomain(doc);
  }

  // ==================================================
  // FIND BY TENANT
  // ==================================================
  async findByTenant(tenantId: string): Promise<SmartPage[]> {
    const docs = await this.smartPageModel
      .find({ tenantId })
      .lean();

    return docs.map((d) => this.toDomain(d));
  }

  // ==================================================
  // FIND ACTIVE PAGE (MAIN ENTRY RESOLUTION)
  // ==================================================
  async findActivePage(input: {
    tenantId: string;
    route?: string;
  }): Promise<SmartPage | null> {
    const query: any = {
      tenantId: input.tenantId,
      status: 'PUBLISHED',
    };

    if (input.route) {
      query.route = input.route;
    }

    const doc = await this.smartPageModel.findOne(query).lean();

    if (!doc) return null;

    return this.toDomain(doc);
  }

  // ==================================================
  // UPDATE
  // ==================================================
  async update(id: string, page: SmartPage): Promise<SmartPage> {
    const updated = await this.smartPageModel
      .findByIdAndUpdate(id, page, {
        new: true,
      })
      .lean();

    if (!updated) {
      throw new Error(`SmartPage not found: ${id}`);
    }

    this.logger.log(`[SmartPageRepo] updated page id=${id}`);

    return this.toDomain(updated);
  }

  // ==================================================
  // DELETE (SOFT OR HARD DEPENDING ON POLICY)
  // ==================================================
  async delete(id: string): Promise<void> {
    await this.smartPageModel.findByIdAndDelete(id);

    this.logger.warn(`[SmartPageRepo] deleted page id=${id}`);
  }

  // ==================================================
  // INTERNAL MAPPER (DB → DOMAIN)
  // ==================================================
  private toDomain(doc: any): SmartPage {
    return new SmartPage({
      id: doc._id?.toString(),
      tenantId: doc.tenantId,
      route: doc.route,
      status: doc.status,
      blocks: doc.blocks ?? [],
      version: doc.version,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}