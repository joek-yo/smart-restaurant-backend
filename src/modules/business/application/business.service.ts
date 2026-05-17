// src/modules/business/application/business.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Business,
  BusinessDocument,
  StorefrontConfig,
} from '@modules/business/infrastructure/schemas/business.schema';

import { CreateBusinessDto } from '@modules/business/application/dto/create-business.dto';
import { UpdateBusinessDto } from '@modules/business/application/dto/update-business.dto';

// 🔥 NEW: Event Bus
import { EventBus } from '@core/events';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,

    private readonly eventBus: EventBus,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // WRITE OPERATIONS
  // ─────────────────────────────────────────────────────────────

  async create(dto: CreateBusinessDto): Promise<Business> {
    const business = new this.businessModel(dto);
    const saved = await business.save();

    // 🔥 EVENTS
    this.eventBus.emit('business.created', {
      business: saved.toObject(),
    });

    this.eventBus.emit('business.updated', {
      business: saved.toObject(),
      type: 'created',
    });

    return saved;
  }

  async update(id: string, dto: UpdateBusinessDto): Promise<Business> {
    const business = await this.businessModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .exec();

    if (!business) throw new NotFoundException('Business not found');

    // 🔥 EVENTS
    this.eventBus.emit('business.updated', {
      business: business.toObject(),
      id,
      type: 'general_update',
    });

    return business;
  }

  async updateStorefront(
    id: string,
    config: Partial<StorefrontConfig>,
  ): Promise<Business> {
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(config)) {
      updates[`storefront.${key}`] = value;
    }

    const business = await this.businessModel
      .findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' })
      .exec();

    if (!business) throw new NotFoundException('Business not found');

    // 🔥 EVENTS (IMPORTANT FOR SMARTPAGE + CACHE)
    this.eventBus.emit('catalog.settings.updated', {
      businessId: id,
      storefront: business.storefront,
    });

    this.eventBus.emit('business.updated', {
      business: business.toObject(),
      id,
      type: 'storefront_update',
    });

    return business;
  }

  async remove(id: string): Promise<void> {
    const result = await this.businessModel.findByIdAndDelete(id).exec();

    if (!result) throw new NotFoundException('Business not found');

    // 🔥 EVENTS
    this.eventBus.emit('business.deleted', {
      id,
    });

    this.eventBus.emit('business.updated', {
      id,
      type: 'deleted',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // READ OPERATIONS
  // ─────────────────────────────────────────────────────────────

  async findAll(): Promise<Business[]> {
    return this.businessModel.find({ isActive: true }).exec();
  }

  async findOne(id: string): Promise<Business> {
    const business = await this.businessModel.findById(id).exec();

    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async findBySlug(slug: string): Promise<Business> {
    const business = await this.businessModel
      .findOne({ slug: slug.toLowerCase().trim(), isActive: true })
      .exec();

    if (!business)
      throw new NotFoundException(`Business "${slug}" not found`);

    return business;
  }

  async findByDomain(domain: string): Promise<Business> {
    const business = await this.businessModel
      .findOne({ domain: domain.toLowerCase().trim(), isActive: true })
      .exec();

    if (!business)
      throw new NotFoundException(`Domain "${domain}" not found`);

    return business;
  }

  async getStorefront(id: string): Promise<StorefrontConfig> {
    const business = await this.businessModel
      .findById(id)
      .select('storefront name logoUrl slug')
      .exec();

    if (!business) throw new NotFoundException('Business not found');

    return business.storefront;
  }
}