// src/modules/business/infrastructure/repositories/business.repository.ts


import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Business, BusinessSchema } from './infrastructure/business.schema';
import { BusinessRepository } from './infrastructure/repositories/business.repository';
import { CreateBusinessUseCase } from './application/use-cases/create-business.usecase';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Business.name,
        schema: BusinessSchema,
      },
    ]),
  ],
  controllers: [],
  providers: [
    BusinessRepository,
    CreateBusinessUseCase,
  ],
  exports: [BusinessRepository],
})
export class BusinessModule {}