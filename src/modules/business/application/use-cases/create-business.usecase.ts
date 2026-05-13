// src/modules/business/application/use-cases/create-business.usecase.ts
import { Injectable } from '@nestjs/common';
import { EventBus } from '@core/events';
import { BUSINESS_EVENTS } from '@core/events/event.constants';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { BusinessService } from '../business.service';
import { Business } from '@modules/business/infrastructure/schemas/business.schema';

@Injectable()
export class CreateBusinessUseCase {
  constructor(
    private readonly businessService: BusinessService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(dto: CreateBusinessDto): Promise<Business> {
    // Pass DTO directly — BusinessService.create() accepts CreateBusinessDto
    const saved = await this.businessService.create(dto);

    const businessId = (saved as any)?._id?.toString?.();

    this.eventBus.emit(BUSINESS_EVENTS.BUSINESS_CREATED, {
      businessId,
      name: saved.name,
    });

    return saved;
  }
}