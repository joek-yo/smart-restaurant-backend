// FILE: src/modules/truth-engine/infrastructure/adapters/business.adapter.ts

import { Injectable } from '@nestjs/common';
import { BusinessService } from '@modules/business/application/business.service';

/**
 * BusinessAdapter
 * ----------------
 * Truth Engine boundary adapter for Business data.
 *
 * Responsibilities:
 * - Fetch business data from BusinessService
 * - Avoid exposing infrastructure/Mongoose details to Truth Engine
 * - Provide a stable contract for normalization layer
 *
 * IMPORTANT:
 * This adapter MUST NOT:
 * - compute derived intelligence
 * - transform deeply (handled by normalizer)
 * - emit events
 */
@Injectable()
export class BusinessAdapter {
  constructor(
    private readonly businessService: BusinessService,
  ) {}

  /**
   * Fetch business by tenantId (businessId)
   */
  async fetch(input: { tenantId: string }) {
    return this.getById(input.tenantId);
  }

  async getById(businessId: string) {
    return this.businessService.findOne(businessId);
  }

  /**
   * Fetch business by slug (used in public storefront flows)
   */
  async getBySlug(slug: string) {
    return this.businessService.findBySlug(slug);
  }

  /**
   * Fetch business by custom domain (if configured)
   */
  async getByDomain(domain: string) {
    return this.businessService.findByDomain(domain);
  }
}