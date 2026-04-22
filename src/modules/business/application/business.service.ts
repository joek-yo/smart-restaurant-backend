// src/modules/business/application/business.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// ✅ Imports aligned with Business domain
import { 
  Business, 
  BusinessDocument 
} from '@modules/business/infrastructure/schemas/business.schema';
import { CreateBusinessDto } from '@modules/business/application/dto/create-business.dto';
import { UpdateBusinessDto } from '@modules/business/application/dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    // ✅ Injected business model for multi-tenant operations
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
  ) {}

  async create(dto: CreateBusinessDto): Promise<Business> {
    const business = new this.businessModel(dto);
    return business.save();
  }

  async findAll(): Promise<Business[]> {
    return this.businessModel.find().exec();
  }

  async findOne(id: string): Promise<Business> {
    const business = await this.businessModel.findById(id).exec();

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  async update(
    id: string,
    dto: UpdateBusinessDto,
  ): Promise<Business> {
    const business = await this.businessModel
      .findByIdAndUpdate(
        id,
        dto,
        {
          returnDocument: 'after', // ✅ Using modern Mongoose pattern
        },
      )
      .exec();

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  async remove(id: string): Promise<void> {
    const result = await this.businessModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Business not found');
    }
  }
}