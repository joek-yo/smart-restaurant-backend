import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  // Tenant scoping — every post belongs to one business
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true, index: true })
  businessId!: Types.ObjectId;

  // ── Core content ───────────────────────────────────────────────────────────
  @Prop({ required: true })
  title!: string;

  // slug is unique per business — not globally
  @Prop({ required: true })
  slug!: string;

  // Full post content — markdown
  @Prop({ default: '' })
  content!: string;

  // Short summary shown in post cards and SEO
  @Prop({ default: '' })
  excerpt!: string;

  @Prop()
  coverImage?: string;

  // ── Metadata ───────────────────────────────────────────────────────────────
  @Prop({ default: '' })
  author!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  // ── Publishing ─────────────────────────────────────────────────────────────
  @Prop({ default: false })
  isPublished!: boolean;

  @Prop()
  publishedAt?: Date;

  // ── SEO ────────────────────────────────────────────────────────────────────
  @Prop()
  metaTitle?: string;

  @Prop()
  metaDescription?: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Compound unique — slug unique within a business, not globally
PostSchema.index({ businessId: 1, slug: 1 }, { unique: true });
PostSchema.index({ businessId: 1, isPublished: 1, publishedAt: -1 });
PostSchema.index({ businessId: 1, tags: 1 });
