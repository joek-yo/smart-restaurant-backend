// src/modules/business/infrastructure/schemas/business.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BusinessDocument = Business & Document;

// ── Delivery zone sub-document ──────────────────────────────────────────────
@Schema({ _id: false })
export class DeliveryZone {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  fee!: number;

  @Prop({ type: [String], default: [] })
  keywords!: string[];
}

export const DeliveryZoneSchema = SchemaFactory.createForClass(DeliveryZone);

// ── Navigation item sub-document ────────────────────────────────────────────
@Schema({ _id: false })
export class NavItem {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  path!: string;
}

export const NavItemSchema = SchemaFactory.createForClass(NavItem);

// ── Social proof item sub-document ──────────────────────────────────────────
@Schema({ _id: false })
export class SocialProofItem {
  @Prop({ required: true })
  text!: string;

  @Prop()
  time?: string;
}

// ── Storefront config sub-document ──────────────────────────────────────────
// Plain class (no @Schema decorator) so it can be imported as a type
// in service and controller without Mongoose decorator conflicts.
// Mongoose handles it via { type: Object } on the parent schema.
export class StorefrontConfig {
  @Prop()
  tagline?: string;

  @Prop()
  whatsapp?: string;

  @Prop()
  banner?: string;

  @Prop()
  drawerBanner?: string;

  // Delivery settings
  @Prop({ default: 300 })
  defaultDeliveryFee!: number;

  @Prop({ default: 10000 })
  freeDeliveryThreshold!: number;

  @Prop({ type: [DeliveryZoneSchema], default: [] })
  deliveryZones!: DeliveryZone[];

  // Navigation
  @Prop({ type: [Object], default: [] })
  navigation!: NavItem[];

  // Social proof ticker
  @Prop({ type: [Object], default: [] })
  socialProof!: SocialProofItem[];

  // UI copy — announcement bar, hero, flash sale
  @Prop({ type: Object, default: {} })
  uiConfig!: {
    announcement?: { text: string; active: boolean };
    flashSale?: { active: boolean; title: string; endTime: string; badge: string };
    hero?: {
      heading: string;
      description: string;
      ctaPrimary: string;
      ctaSecondary: string;
    };
    bespokeSourcing?: {
      badge: string;
      title: string;
      description: string;
      buttonText: string;
    };
  };

  // Trust bar items e.g. ["M-PESA Accepted", "Fast Delivery"]
  @Prop({ type: [String], default: [] })
  trustItems!: string[];
}



// ── Business (main document) ─────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Business {
  // Core identity
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, unique: true })
  phone!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  // slug is the tenant key — used in subdomain and URL path resolution
  // e.g. "pdk" for pdk.yourapp.com or /t/pdk/
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  // Optional custom domain e.g. "shop.primedeals.co.ke"
  @Prop({ unique: true, sparse: true })
  domain?: string;

  @Prop()
  address?: string;

  @Prop()
  logoUrl?: string;

  @Prop({ required: true })
  timezone!: string;

  @Prop({ required: true })
  currency!: string;

  @Prop({
    type: Object,
    default: { open: '09:00', close: '22:00' },
  })
  businessHours!: { open: string; close: string };

  @Prop({ default: 'starter' })
  subscriptionPlan!: string;

  @Prop({ default: true })
  isActive!: boolean;

  // Multi-branch support
  @Prop({ type: [Types.ObjectId], ref: 'Branch', default: [] })
  branches!: Types.ObjectId[];

  // Storefront config — replaces menu.json per tenant
  @Prop({ type: Object, default: () => ({}) })
  storefront!: StorefrontConfig;

  // Escape hatch for future engine-specific settings
  @Prop({ type: Object, default: {} })
  settings!: Record<string, any>;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);

// Indexes for fast tenant resolution on every request
BusinessSchema.index({ slug: 1 });
BusinessSchema.index({ domain: 1 });