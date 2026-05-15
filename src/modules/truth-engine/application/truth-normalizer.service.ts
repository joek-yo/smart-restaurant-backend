// FILE: src/modules/truth-engine/application/truth-normalizer.service.ts

import { Injectable } from '@nestjs/common';

import {
  BusinessTruth,
  SessionTruth,
  CatalogTruth,
  ConversationTruth,
} from '../domain/truth.types';

/**
 * =====================================================
 * 🧠 TRUTH NORMALIZER SERVICE
 * =====================================================
 *
 * Responsibility:
 * - Normalize raw DB/service outputs into canonical Truth shapes
 * - Remove null / undefined noise
 * - Enforce consistent field naming
 * - Ensure deterministic structure across modules
 *
 * IMPORTANT:
 * This service does NOT compute intelligence.
 * It ONLY cleans and standardizes data.
 * =====================================================
 */

@Injectable()
export class TruthNormalizerService {
  /**
   * =====================================================
   * 🏢 BUSINESS NORMALIZATION
   * =====================================================
   */
  normalizeBusiness(raw: any): BusinessTruth | null {
    if (!raw) return null;

    return {
      id: this.toString(raw._id ?? raw.id),
      name: raw.name ?? '',
      slug: raw.slug ?? undefined,
      currency: raw.currency ?? undefined,
      timezone: raw.timezone ?? undefined,
      isActive: raw.isActive ?? true,

      storefront: this.cleanObject(raw.storefront),
      features: this.cleanObject(raw.features),
    };
  }

  /**
   * =====================================================
   * 🧾 SESSION NORMALIZATION
   * =====================================================
   */
  normalizeSession(raw: any): SessionTruth | null {
    if (!raw) return null;

    return {
      id: this.toString(raw._id ?? raw.id),
      tenantId: this.toString(raw.tenantId ?? raw.businessId),
      userId: this.toString(raw.userId),

      state: raw.state ?? undefined,

      items: Array.isArray(raw.items)
        ? raw.items.map((item: any) => ({
            productId: this.toString(item.productId),
            name: item.name ?? undefined,
            price: this.toNumber(item.price),
            quantity: this.toNumber(item.quantity ?? 1),
          }))
        : [],

      subtotal: this.toNumber(raw.subtotal),
      total: this.toNumber(raw.total),

      expiresAt: raw.expiresAt ? new Date(raw.expiresAt) : undefined,
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : undefined,
    };
  }

  /**
   * =====================================================
   * 🛒 CATALOG NORMALIZATION
   * =====================================================
   */
  normalizeCatalog(raw: any): CatalogTruth | null {
    if (!raw) return null;

    return {
      products: Array.isArray(raw.products)
        ? raw.products.map((p: any) => ({
            id: this.toString(p._id ?? p.id),
            name: p.name ?? '',
            price: this.toNumber(p.price),
            categoryId: this.toString(p.categoryId),
            stock: this.toNumber(p.stock),
            isOutOfStock: !!p.isOutOfStock,
          }))
        : [],

      categories: Array.isArray(raw.categories)
        ? raw.categories.map((c: any) => ({
            id: this.toString(c._id ?? c.id),
            name: c.name ?? '',
          }))
        : [],
    };
  }

  /**
   * =====================================================
   * 💬 CONVERSATION NORMALIZATION
   * =====================================================
   */
  normalizeConversation(raw: any): ConversationTruth | null {
    if (!raw) return null;

    return {
      state: raw.state ?? undefined,
      memory: this.cleanObject(raw.memory),
      lastMessage: raw.lastMessage ?? undefined,
      intent: raw.intent ?? undefined,

      recoveryMarker: raw.recoveryMarker
        ? {
            retryCount: this.toNumber(raw.recoveryMarker.retryCount),
            reason: raw.recoveryMarker.reason ?? undefined,
          }
        : undefined,
    };
  }

  /**
   * =====================================================
   * 🧼 INTERNAL CLEANERS
   * =====================================================
   */

  private cleanObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return undefined;

    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      cleaned[key] = value;
    }

    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  private toString(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined || isNaN(value)) {
      return 0;
    }
    return Number(value);
  }
}