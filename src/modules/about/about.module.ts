// src/modules/about/about.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { About, AboutSchema } from './infrastructure/schemas/about.schema';
import { AboutService } from './application/about.service';
import { AboutController } from './presentation/about.controller';
import { TenantModule } from '@core/tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: About.name, schema: AboutSchema }]),
    TenantModule,
  ],
  controllers: [AboutController],
  providers: [AboutService],
  exports: [AboutService],
})
export class AboutModule {}