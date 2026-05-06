// src/modules/about/presentation/about.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AboutService } from '../application/about.service';
import { Tenant } from '@core/tenant/tenant.decorator';
import { TenantGuard } from '@core/tenant/tenant.guard';
import { BusinessDocument } from '@modules/business/infrastructure/schemas/business.schema';
import { About } from '../infrastructure/schemas/about.schema';

@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  // ── Public endpoint — storefront reads this ────────────────────────────
  // GET /about/:businessId
  // Called by Next.js about/page.tsx server-side

  @Get(':businessId')
  getAbout(@Param('businessId') businessId: string) {
    return this.aboutService.findByBusiness(businessId);
  }

  // ── Protected endpoints — dashboard/admin only ─────────────────────────
  // Uses @Tenant() decorator — tenant resolved from x-tenant-slug header
  // consistent with rest of your backend architecture

  @Get()
  @UseGuards(TenantGuard)
  getAboutAdmin(@Tenant() tenant: BusinessDocument) {
    return this.aboutService.findByBusinessAdmin(
      (tenant._id as any).toString(),
    );
  }

  @Patch()
  @UseGuards(TenantGuard)
  updateAbout(
    @Tenant() tenant: BusinessDocument,
    @Body() data: Partial<About>,
  ) {
    return this.aboutService.upsert(
      (tenant._id as any).toString(),
      data,
    );
  }

  @Patch('publish')
  @UseGuards(TenantGuard)
  publish(@Tenant() tenant: BusinessDocument) {
    return this.aboutService.publish((tenant._id as any).toString());
  }

  @Patch('unpublish')
  @UseGuards(TenantGuard)
  unpublish(@Tenant() tenant: BusinessDocument) {
    return this.aboutService.unpublish((tenant._id as any).toString());
  }
}