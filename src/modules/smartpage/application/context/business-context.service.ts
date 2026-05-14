// src/modules/smartpage/application/context/business-context.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { BusinessRepository } from '@modules/business/domain/repositories/business.repository';

/**
 * BusinessContextService
 * ----------------------
 * Builds a normalized "business intelligence layer"
 * used by SmartPage rendering engine.
 */
@Injectable()
export class BusinessContextService {
  private readonly logger = new Logger(BusinessContextService.name);

  constructor(
    private readonly businessRepository: BusinessRepository,
  ) {}

  /**
   * Builds business context for SmartPage rendering
   */
  async buildBusinessContext(input: {
    tenantId: string; // businessId / slug resolved earlier
  }) {
    const business = await this.businessRepository.findById(
      input.tenantId,
    );

    if (!business) {
      this.logger.warn(
        `[BusinessContext] Business not found: ${input.tenantId}`,
      );

      return null;
    }

    const storefront = business.storefront ?? {};
    const features = business.features ?? {};

    return {
      // ===============================
      // CORE IDENTITY
      // ===============================
      tenantId: business.id,
      name: business.name,
      slug: business.slug,
      businessType: business.businessType,

      // ===============================
      // BRANDING
      // ===============================
      branding: {
        logoUrl: business.logoUrl,
        currency: business.currency,
        timezone: business.timezone,
      },

      // ===============================
      // FEATURE FLAGS
      // ===============================
      features: {
        ...features,
      },

      // ===============================
      // STOREFRONT CONFIG
      // ===============================
      storefront: {
        tagline: storefront.tagline,
        whatsapp: storefront.whatsapp,
        banner: storefront.banner,
        drawerBanner: storefront.drawerBanner,

        uiConfig: storefront.uiConfig,
        trustItems: storefront.trustItems,
        navigation: storefront.navigation,
        socialProof: storefront.socialProof,
      },

      // ===============================
      // DELIVERY SETTINGS
      // ===============================
      delivery: {
        defaultFee: storefront.defaultDeliveryFee,
        freeDeliveryThreshold: storefront.freeDeliveryThreshold,
        zones: storefront.deliveryZones ?? [],
      },

      // ===============================
      // BUSINESS OPERATIONS
      // ===============================
      operatingHours: business.businessHours,
      isActive: business.isActive,
      subscriptionPlan: business.subscriptionPlan,

      // ===============================
      // RAW (FOR ADVANCED FEATURES / DEBUGGING)
      // ===============================
      _raw: business,
    };
  }
}