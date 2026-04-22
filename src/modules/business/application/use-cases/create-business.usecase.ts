// src/modules/business/application/use-cases/create-business.usecase.ts

import { Injectable } from '@nestjs/common';
import { Business } from '../../domain/entities/business.entity';
// ✅ STEP 3 FIX: Import the correctly named Business DTO
import { CreateBusinessDto } from '../dto/create-business.dto';

@Injectable()
export class CreateBusinessUseCase {
  /**
   * Orchestrates the creation of a new business entity.
   */
  async execute(dto: CreateBusinessDto): Promise<Business> {
    // We now have full IntelliSense because we're using CreateBusinessDto
    return new Business({
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      logoUrl: dto.logoUrl,
      timezone: dto.timezone,
      currency: dto.currency,
      operatingHours: dto.operatingHours,
      subscriptionPlan: dto.subscriptionPlan || 'starter',
      isActive: true,
    });
  }
}