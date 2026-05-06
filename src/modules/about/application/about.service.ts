// src/modules/about/application/about.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { About, AboutDocument } from '../infrastructure/schemas/about.schema';

@Injectable()
export class AboutService {
  constructor(
    @InjectModel(About.name)
    private readonly aboutModel: Model<AboutDocument>,
  ) {}

  // ── Read ───────────────────────────────────────────────────────────────────

  async findByBusiness(businessId: string): Promise<About> {
    const about = await this.aboutModel
      .findOne({
        businessId: new Types.ObjectId(businessId),
        isPublished: true,
      })
      .exec();

    if (!about) throw new NotFoundException('About page not found');
    return about;
  }

  // For admin/dashboard — returns even unpublished
  async findByBusinessAdmin(businessId: string): Promise<About | null> {
    return this.aboutModel
      .findOne({ businessId: new Types.ObjectId(businessId) })
      .exec();
  }

  // ── Write ──────────────────────────────────────────────────────────────────
  // Upsert — create on first save, update on subsequent saves
  // One about page per business, always

  async upsert(businessId: string, data: Partial<About>): Promise<About> {
    const about = await this.aboutModel
      .findOneAndUpdate(
        { businessId: new Types.ObjectId(businessId) },
        {
          $set: {
            ...data,
            businessId: new Types.ObjectId(businessId),
          },
        },
        { returnDocument: 'after', upsert: true },
      )
      .exec();

    if (!about) throw new NotFoundException('Failed to upsert about page');
    return about;
  }

  async publish(businessId: string): Promise<About> {
    return this.upsert(businessId, { isPublished: true });
  }

  async unpublish(businessId: string): Promise<About> {
    return this.upsert(businessId, { isPublished: false });
  }
}