// src/modules/business/application/use-cases/create-business.usecase.ts

import { Injectable } from '@nestjs/common';
import { EventBus, EVENTS } from '@core/events';

import { Business } from '../../domain/entities/business.entity';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { BusinessService } from '../business.service';

@Injectable()
export class CreateBusinessUseCase {
  constructor(
    private readonly businessService: BusinessService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(dto: CreateBusinessDto): Promise<Business> {
    const business = new Business({
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

    // ✅ SAVE TO DB
    const saved = await this.businessService.create(business);

    // 🔥 SAFE ID NORMALIZATION (NO TS ERRORS)
    const businessId = (saved as any)?._id?.toString?.();

    // 🔥 EMIT EVENT
    this.eventBus.emit(EVENTS.BUSINESS_CREATED, {
      businessId,
      name: saved.name,
    });

    return saved;
  }
}