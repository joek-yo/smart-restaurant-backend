// src/modules/blog/presentation/blog.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogService } from '../application/blog.service';
import { Tenant } from '@core/tenant/tenant.decorator';
import { TenantGuard } from '@core/tenant/tenant.guard';
import { BusinessDocument } from '@modules/business/infrastructure/schemas/business.schema';
import { Post as BlogPost } from '../infrastructure/schemas/post.schema';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ── Public endpoints — storefront reads these ──────────────────────────

  // GET /blog?businessId=xxx&page=1&tag=deals
  @Get()
  findAll(
    @Query('businessId') businessId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('tag') tag?: string,
  ) {
    return this.blogService.findAll(
      businessId,
      parseInt(page),
      parseInt(limit),
      tag,
    );
  }

  // GET /blog/tags?businessId=xxx
  @Get('tags')
  findTags(@Query('businessId') businessId: string) {
    return this.blogService.findTags(businessId);
  }

  // GET /blog/featured?businessId=xxx
  @Get('featured')
  findFeatured(@Query('businessId') businessId: string) {
    return this.blogService.findFeatured(businessId);
  }

  // GET /blog/:businessId/:slug
  @Get(':businessId/:slug')
  findBySlug(
    @Param('businessId') businessId: string,
    @Param('slug') slug: string,
  ) {
    return this.blogService.findBySlug(businessId, slug);
  }

  // ── Protected endpoints — dashboard/admin only ─────────────────────────

  // GET /blog/admin/posts
  @Get('admin/posts')
  @UseGuards(TenantGuard)
  findAllAdmin(@Tenant() tenant: BusinessDocument) {
    return this.blogService.findAllAdmin((tenant._id as any).toString());
  }

  // POST /blog/admin/posts
  @Post('admin/posts')
  @UseGuards(TenantGuard)
  create(
    @Tenant() tenant: BusinessDocument,
    @Body() data: Partial<BlogPost>,
  ) {
    return this.blogService.create((tenant._id as any).toString(), data);
  }

  // PATCH /blog/admin/posts/:id
  @Patch('admin/posts/:id')
  @UseGuards(TenantGuard)
  update(@Param('id') id: string, @Body() data: Partial<BlogPost>) {
    return this.blogService.update(id, data);
  }

  // PATCH /blog/admin/posts/:id/publish
  @Patch('admin/posts/:id/publish')
  @UseGuards(TenantGuard)
  publish(@Param('id') id: string) {
    return this.blogService.publish(id);
  }

  // PATCH /blog/admin/posts/:id/unpublish
  @Patch('admin/posts/:id/unpublish')
  @UseGuards(TenantGuard)
  unpublish(@Param('id') id: string) {
    return this.blogService.unpublish(id);
  }

  // DELETE /blog/admin/posts/:id
  @Delete('admin/posts/:id')
  @UseGuards(TenantGuard)
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}