// src/modules/blog/blog.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './infrastructure/schemas/post.schema';
import { BlogService } from './application/blog.service';
import { BlogController } from './presentation/blog.controller';
import { TenantModule } from '@core/tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    TenantModule,
  ],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}