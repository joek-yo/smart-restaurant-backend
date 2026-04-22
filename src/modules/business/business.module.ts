// src/modules/business/business.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// 🔥 CORE EVENT SYSTEM IMPORT
import { CoreEventModule } from '../../core/events/core-event.module';

// Presentation
import { BusinessController } from './presentation/business.controller';

// Application
import { BusinessService } from './application/business.service';
import { CreateBusinessUseCase } from './application/use-cases/create-business.usecase';
import { GetSettingsUseCase } from './application/use-cases/get-settings.usecase';
import { UpdateSettingsUseCase } from './application/use-cases/update-settings.usecase';

// Infrastructure
import { Business, BusinessSchema } from './infrastructure/schemas/business.schema';
import {
  BusinessSettings,
  BusinessSettingsSchema,
} from './infrastructure/schemas/business-settings.schema';

// Listeners
import { BusinessCreatedListener } from './application/listeners/business-created.listener';

@Module({
  imports: [
    // ✅ ADDED: Explicitly import the Event System
    CoreEventModule, 

    MongooseModule.forFeature([
      {
        name: Business.name,
        schema: BusinessSchema,
      },
      {
        name: BusinessSettings.name,
        schema: BusinessSettingsSchema,
      },
    ]),
  ],

  controllers: [BusinessController],

  providers: [
    BusinessService,
    CreateBusinessUseCase,
    GetSettingsUseCase,
    UpdateSettingsUseCase,
    BusinessCreatedListener,
  ],

  exports: [
    BusinessService,
    CreateBusinessUseCase,
  ],
})
export class BusinessModule {}