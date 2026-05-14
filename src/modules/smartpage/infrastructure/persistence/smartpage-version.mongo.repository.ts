// FILE: src/modules/smartpage/infrastructure/persistence/smartpage-version.mongo.repository.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { SmartPageVersionRepository } from '../../domain/repositories/smartpage-version.repository';
import { SmartPageVersion } from '../../domain/entities/smartpage-version.entity';

import { SmartPageVersionDocument } from '../schemas/smartpage-version.schema';

/**
 * SmartPageVersionMongoRepository
 * -----------------------------------------------------
 * Handles persistence of SmartPage versions.
 *
 * Responsibilities:
 * - Save page snapshots (draft/published)
 * - Retrieve version history
 * - Enable rollback
 * - Support A/B testing variants
 */

@Injectable()
export class SmartPageVersionMongoRepository
  implements SmartPageVersionRepository
{
  private readonly logger = new Logger(
    SmartPageVersionMongoRepository.name,
  );

  constructor(
    @InjectModel('SmartPageVersion')
    private readonly versionModel: Model<SmartPageVersionDocument>,
  ) {}

  // ==================================================
  // CREATE VERSION SNAPSHOT
  // ==================================================
  async create(version: SmartPageVersion): Promise<SmartPageVersion> {
    const created = await this.versionModel.create(version);

    this.logger.log(
      `[SmartPageVersionRepo] created version id=${created._id}`,
    );

    return this.toDomain(created);
  }

  // ==================================================
  // FIND BY ID
  // ==================================================
  async findById(id: string): Promise<SmartPageVersion | null> {
    const doc = await this.versionModel.findById(id).lean();

    if (!doc) return null;

    return this.toDomain(doc);
  }

  // ==================================================
  // FIND ALL VERSIONS OF A PAGE
  // ==================================================
  async findByPageId(pageId: string): Promise<SmartPageVersion[]> {
    const docs = await this.versionModel
      .find({ pageId })
      .sort({ createdAt: -1 })
      .lean();

    return docs.map((d) => this.toDomain(d));
  }

  // ==================================================
  // FIND LATEST VERSION
  // ==================================================
  async findLatest(pageId: string): Promise<SmartPageVersion | null> {
    const doc = await this.versionModel
      .findOne({ pageId })
      .sort({ createdAt: -1 })
      .lean();

    if (!doc) return null;

    return this.toDomain(doc);
  }

  // ==================================================
  // FIND PUBLISHED VERSION
  // ==================================================
  async findPublished(
    pageId: string,
  ): Promise<SmartPageVersion | null> {
    const doc = await this.versionModel
      .findOne({ pageId, status: 'PUBLISHED' })
      .sort({ createdAt: -1 })
      .lean();

    if (!doc) return null;

    return this.toDomain(doc);
  }

  // ==================================================
  // UPDATE VERSION
  // ==================================================
  async update(
    id: string,
    version: SmartPageVersion,
  ): Promise<SmartPageVersion> {
    const updated = await this.versionModel
      .findByIdAndUpdate(id, version, { new: true })
      .lean();

    if (!updated) {
      throw new Error(`SmartPageVersion not found: ${id}`);
    }

    this.logger.log(`[SmartPageVersionRepo] updated id=${id}`);

    return this.toDomain(updated);
  }

  // ==================================================
  // DELETE VERSION
  // ==================================================
  async delete(id: string): Promise<void> {
    await this.versionModel.findByIdAndDelete(id);

    this.logger.warn(`[SmartPageVersionRepo] deleted id=${id}`);
  }

  // ==================================================
  // INTERNAL MAPPER (DB → DOMAIN)
  // ==================================================
  private toDomain(doc: any): SmartPageVersion {
    return new SmartPageVersion({
      id: doc._id?.toString(),
      pageId: doc.pageId,
      tenantId: doc.tenantId,
      versionNumber: doc.versionNumber,
      status: doc.status,
      snapshot: doc.snapshot,
      changelog: doc.changelog,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}