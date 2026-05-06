// src/modules/blog/application/blog.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../infrastructure/schemas/post.schema';

export interface PostsResult {
  posts: Post[];
  total: number;
  page: number;
  pages: number;
}

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
  ) {}

  // ── Read (public) ──────────────────────────────────────────────────────────

  async findAll(
    businessId: string,
    page = 1,
    limit = 10,
    tag?: string,
  ): Promise<PostsResult> {
    const filter: any = {
      businessId: new Types.ObjectId(businessId),
      isPublished: true,
    };

    if (tag) filter.tags = tag;

    const total = await this.postModel.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const posts = await this.postModel
      .find(filter)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-content') // exclude full content from list — saves bandwidth
      .exec();

    return { posts, total, page, pages };
  }

  async findBySlug(businessId: string, slug: string): Promise<Post> {
    const post = await this.postModel
      .findOne({
        businessId: new Types.ObjectId(businessId),
        slug,
        isPublished: true,
      })
      .exec();

    if (!post) throw new NotFoundException(`Post "${slug}" not found`);
    return post;
  }

  // Featured post — most recent published
  async findFeatured(businessId: string): Promise<Post | null> {
    return this.postModel
      .findOne({
        businessId: new Types.ObjectId(businessId),
        isPublished: true,
      })
      .sort({ publishedAt: -1 })
      .exec();
  }

  // Related posts — same tags, exclude current post
  async findRelated(
    businessId: string,
    postId: string,
    tags: string[],
    limit = 3,
  ): Promise<Post[]> {
    return this.postModel
      .find({
        businessId: new Types.ObjectId(businessId),
        _id: { $ne: new Types.ObjectId(postId) },
        isPublished: true,
        tags: { $in: tags },
      })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select('-content')
      .exec();
  }

  // All tags used by a business — for filter bar
  async findTags(businessId: string): Promise<string[]> {
    const result = await this.postModel.distinct('tags', {
      businessId: new Types.ObjectId(businessId),
      isPublished: true,
    });
    return result as string[];
  }

  // ── Read (admin) ───────────────────────────────────────────────────────────

  async findAllAdmin(businessId: string): Promise<Post[]> {
    return this.postModel
      .find({ businessId: new Types.ObjectId(businessId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<Post> {
    const post = await this.postModel.findById(id).exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  // ── Write ──────────────────────────────────────────────────────────────────

  async create(businessId: string, data: Partial<Post>): Promise<Post> {
    // Ensure slug is unique within this business
    const exists = await this.postModel.findOne({
      businessId: new Types.ObjectId(businessId),
      slug: data.slug,
    });

    if (exists) {
      throw new ConflictException(
        `A post with slug "${data.slug}" already exists`,
      );
    }

    const post = await this.postModel.create({
      ...data,
      businessId: new Types.ObjectId(businessId),
      isPublished: false,
    });

    return post;
  }

  async update(id: string, data: Partial<Post>): Promise<Post> {
    const post = await this.postModel
      .findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' })
      .exec();

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async publish(id: string): Promise<Post> {
    return this.update(id, {
      isPublished: true,
      publishedAt: new Date(),
    });
  }

  async unpublish(id: string): Promise<Post> {
    return this.update(id, { isPublished: false });
  }

  async remove(id: string): Promise<void> {
    const result = await this.postModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Post not found');
  }
}