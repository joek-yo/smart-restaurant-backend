// src/core/tenant/tenant.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Business,
  BusinessSchema,
} from '@modules/business/infrastructure/schemas/business.schema';
import { TenantGuard } from './tenant.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Business.name, schema: BusinessSchema },
    ]),
  ],
  providers: [TenantGuard],
  exports: [TenantGuard, MongooseModule],
})
export class TenantModule {}
