// FILE: src/modules/truth-engine/infrastructure/adapters/catalog.adapter.ts

import { Injectable } from '@nestjs/common';
import { CatalogService } from '@modules/catalog/application/catalog.service';

/**
 * CatalogAdapter
 * --------------
 * Truth Engine boundary adapter for Catalog data.
 *
 * Responsibilities:
 * - Fetch products and categories from CatalogService
 * - Provide read-only catalog data to Truth Engine
 * - Keep catalog domain isolated from Truth Engine logic
 *
 * IMPORTANT RULES:
 * - NO computation (pricing logic, availability logic, etc.)
 * - NO transformation (handled by TruthNormalizerService)
 * - READ-ONLY access only
 */
@Injectable()
export class CatalogAdapter {
  constructor(
    private readonly catalogService: CatalogService,
  ) {}

  /**
   * Fetch all products for a business
   */
  async fetch(input: { tenantId: string }) {
    const [products, categories] = await Promise.all([
      this.getProducts(input.tenantId),
      this.getCategories(input.tenantId),
    ]);
    return { products, categories };
  }

  async getProducts(businessId: string) {
    return this.catalogService.getProducts(businessId);
  }

  /**
   * Fetch products by category
   */
  async getProductsByCategory(categoryId: string) {
    return this.catalogService.getProductsByCategory(categoryId);
  }

  /**
   * Fetch all categories for a business
   */
  async getCategories(businessId: string) {
    return this.catalogService.findCategories(businessId);
  }

  /**
   * Fetch catalog settings (pricing rules, UI flags, etc.)
   */
  async getSettings(businessId: string) {
    return this.catalogService.getCatalogSettings(businessId);
  }
}