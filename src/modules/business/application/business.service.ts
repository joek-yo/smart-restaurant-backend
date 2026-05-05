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

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
  ) {}

  // ── Write ──────────────────────────────────────────────────────────────────

  async create(dto: CreateBusinessDto): Promise<Business> {
    const business = new this.businessModel(dto);
    return business.save();
  }

  async update(id: string, dto: UpdateBusinessDto): Promise<Business> {
    const business = await this.businessModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .exec();

    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async updateStorefront(
    id: string,
    config: Partial<StorefrontConfig>,
  ): Promise<Business> {
    // $set with dot notation so partial updates don't wipe the whole sub-doc
    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(config)) {
      updates[`storefront.${key}`] = value;
    }

    const business = await this.businessModel
      .findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' })
      .exec();

    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async remove(id: string): Promise<void> {
    const result = await this.businessModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Business not found');
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  async findAll(): Promise<Business[]> {
    return this.businessModel.find({ isActive: true }).exec();
  }

  async findOne(id: string): Promise<Business> {
    const business = await this.businessModel.findById(id).exec();
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  // Used by Next.js middleware for subdomain/path resolution
  // e.g. slug = "pdk" from pdk.yourapp.com
  async findBySlug(slug: string): Promise<Business> {
    const business = await this.businessModel
      .findOne({ slug: slug.toLowerCase().trim(), isActive: true })
      .exec();

    if (!business) throw new NotFoundException(`Business "${slug}" not found`);
    return business;
  }

  // Used by Next.js middleware for custom domain resolution
  // e.g. domain = "shop.primedeals.co.ke"
  async findByDomain(domain: string): Promise<Business> {
    const business = await this.businessModel
      .findOne({ domain: domain.toLowerCase().trim(), isActive: true })
      .exec();

    if (!business) throw new NotFoundException(`Domain "${domain}" not found`);
    return business;
  }

  // Returns only the storefront config — lightweight call for the frontend
  async getStorefront(id: string): Promise<StorefrontConfig> {
    const business = await this.businessModel
      .findById(id)
      .select('storefront name logoUrl slug')
      .exec();

    if (!business) throw new NotFoundException('Business not found');
    return business.storefront;
  }
}