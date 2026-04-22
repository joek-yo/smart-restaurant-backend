// src/modules/business/business.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Presentation
import { BusinessController } from './presentation/business.controller';

// Application
import { BusinessService } from './application/business.service';
import { CreateBusinessUseCase } from './application/use-cases/create-business.usecase';
import { GetSettingsUseCase } from './application/use-cases/get-settings.usecase';
import { UpdateSettingsUseCase } from './application/use-cases/update-settings.usecase';

// Infrastructure (Using the final 'Business' naming)
import { Business, BusinessSchema } from './infrastructure/schemas/business.schema';
import { 
  BusinessSettings, 
  BusinessSettingsSchema 
} from './infrastructure/schemas/business-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: Business.name, 
        schema: BusinessSchema 
      },
      { 
        name: BusinessSettings.name, 
        schema: BusinessSettingsSchema 
      },
    ]),
  ],

  controllers: [BusinessController],

  providers: [
    BusinessService,
    CreateBusinessUseCase,
    GetSettingsUseCase,
    UpdateSettingsUseCase,
  ],

  exports: [
    BusinessService,
    CreateBusinessUseCase,
  ],
})
export class BusinessModule {}