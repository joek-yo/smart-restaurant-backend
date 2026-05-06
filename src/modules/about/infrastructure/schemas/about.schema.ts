// src/modules/about/infrastructure/schemas/about.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AboutDocument = About & Document;

// ── Team member sub-document ───────────────────────────────────────────────
@Schema({ _id: false })
export class TeamMember {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  role!: string;

  @Prop()
  photo?: string;

  @Prop()
  bio?: string;
}

// ── Stat sub-document ──────────────────────────────────────────────────────
@Schema({ _id: false })
export class BusinessStat {
  @Prop({ required: true })
  label!: string;       // e.g. "Happy Customers"

  @Prop({ required: true })
  value!: string;       // e.g. "500+" — string so you can format freely
}

// ── Value sub-document ─────────────────────────────────────────────────────
@Schema({ _id: false })
export class BusinessValue {
  @Prop({ required: true })
  title!: string;       // e.g. "Quality First"

  @Prop({ required: true })
  description!: string;
}

// ── About (main document) ──────────────────────────────────────────────────
@Schema({ timestamps: true })
export class About {
  // One about page per business — unique constraint enforces this
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true, unique: true })
  businessId!: Types.ObjectId;

  // Hero
  @Prop({ default: '' })
  headline!: string;          // e.g. "We bring global tech to Kenya"

  @Prop({ default: '' })
  subheadline!: string;       // e.g. "Founded in Nairobi, built for Africa"

  @Prop()
  coverImage?: string;

  // Story
  @Prop({ default: '' })
  story!: string;             // markdown supported

  // Mission, vision
  @Prop({ default: '' })
  mission!: string;

  @Prop({ default: '' })
  vision!: string;

  // Values grid
  @Prop({ type: [Object], default: [] })
  values!: BusinessValue[];

  // Stats bar e.g. "500+ Customers", "3 Years in Business"
  @Prop({ type: [Object], default: [] })
  stats!: BusinessStat[];

  // Team section
  @Prop({ type: [Object], default: [] })
  team!: TeamMember[];

  // SEO
  @Prop()
  metaTitle?: string;

  @Prop()
  metaDescription?: string;

  @Prop({ default: false })
  isPublished!: boolean;
}

export const AboutSchema = SchemaFactory.createForClass(About);

// Fast lookup by businessId
AboutSchema.index({ businessId: 1 });