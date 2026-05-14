// FILE: src/modules/smartpage/infrastructure/adapters/catalog.adapter.ts

import { Injectable, Logger } from '@nestjs/common';

import { CatalogItem } from '@modules/catalog/domain/entities/catalog-item.entity';
import { Category } from '@modules/catalog/domain/entities/category.entity';

/**
 * CatalogAdapter
 * -----------------------------------------------------
 * Bridge between SmartPage engine and Catalog module.
 *
 * Responsibilities:
 * - Fetch categories
 * - Fetch products
 * - Normalize catalog data for SmartPage blocks
 * - Decouple SmartPage from catalog implementation details
 */

@Injectable()
export class CatalogAdapter {
  private readonly logger = new Logger(CatalogAdapter.name);

  constructor(
    // In real system this would be injected services or repositories
    // private readonly catalogService: CatalogService,
    // private readonly categoryService: CategoryService,
  ) {}

  // ==================================================
  // 📦 GET CATEGORIES FOR BLOCKS
  // ==================================================
  async getCategories(input: {
    tenantId: string;
  }): Promise<NormalizedCategory[]> {
    this.logger.log(
      `[CatalogAdapter] fetching categories tenant=${input.tenantId}`,
    );

    // TODO: replace with real catalog service call
    const categories: Category[] = [];

    return categories.map((cat) => this.normalizeCategory(cat));
  }

  // ==================================================
  // 🛒 GET PRODUCTS FOR BLOCKS
  // ==================================================
  async getProducts(input: {
    tenantId: string;
    categoryId?: string;
    limit?: number;
    featured?: boolean;
    trending?: boolean;
  }): Promise<NormalizedProduct[]> {
    this.logger.log(
      `[CatalogAdapter] fetching products tenant=${input.tenantId}`,
    );

    // TODO: replace with real catalog service/repository
    const products: CatalogItem[] = [];

    return products.map((p) => this.normalizeProduct(p));
  }

  // ==================================================
  // ⭐ GET FEATURED PRODUCTS
  // ==================================================
  async getFeaturedProducts(input: {
    tenantId: string;
    limit?: number;
  }): Promise<NormalizedProduct[]> {
    return this.getProducts({
      tenantId: input.tenantId,
      featured: true,
      limit: input.limit ?? 10,
    });
  }

  // ==================================================
  // 🔥 GET TRENDING PRODUCTS
  // ==================================================
  async getTrendingProducts(input: {
    tenantId: string;
    limit?: number;
  }): Promise<NormalizedProduct[]> {
    return this.getProducts({
      tenantId: input.tenantId,
      trending: true,
      limit: input.limit ?? 10,
    });
  }

  // ==================================================
  // 🔄 NORMALIZATION LAYER (CRITICAL)
  // ==================================================
  private normalizeProduct(product: CatalogItem): NormalizedProduct {
    return {
      id: product.id!,
      name: product.name,
      price: product.price,
      description: product.description,
      image: (product.options?.[0] as any)?.image ?? null,
      isAvailable: product.status === 'ACTIVE',
      categoryId: product.categoryId,
    };
  }

  private normalizeCategory(category: Category): NormalizedCategory {
    return {
      id: category.id!,
      name: category.name,
      description: category.description,
    };
  }
}

// ==================================================
// 📦 NORMALIZED TYPES (SMARTPAGE SAFE FORMAT)
// ==================================================

export interface NormalizedProduct {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string | null;
  isAvailable: boolean;
  categoryId: string;
}

export interface NormalizedCategory {
  id: string;
  name: string;
  description?: string;
}