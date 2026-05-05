// src/core/tenant/tenant.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Business, BusinessSchema } from '@modules/business/infrastructure/schemas/business.schema';
import { TenantGuard } from './tenant.guard';
import { FeaturesGuard } from './features.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }]),
  ],
  providers: [TenantGuard, FeaturesGuard],
  exports: [TenantGuard, FeaturesGuard, MongooseModule],
})
export class TenantModule {}
