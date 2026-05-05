// src/core/tenant/tenant.middleware.ts

import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Business, BusinessDocument } from '@modules/business/infrastructure/schemas/business.schema';

// Extend Express Request to carry tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: BusinessDocument;
      tenantId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Resolution order:
    // 1. x-tenant-id header (direct businessId)
    // 2. x-tenant-slug header (slug)
    // 3. Host header (custom domain)

    const tenantId = req.headers['x-tenant-id'] as string;
    const tenantSlug = req.headers['x-tenant-slug'] as string;
    const host = req.headers['host'] as string;

    let business: BusinessDocument | null = null;

    if (tenantId) {
      business = await this.businessModel.findById(tenantId).exec();
    } else if (tenantSlug) {
      business = await this.businessModel
        .findOne({ slug: tenantSlug, isActive: true })
        .exec();
    } else if (host && !host.includes('localhost')) {
      business = await this.businessModel
        .findOne({ domain: host, isActive: true })
        .exec();
    }

    if (business) {
      req.tenant = business;
      req.tenantId = (business._id as any).toString();
    }

    // We don't throw here — some routes are public (e.g. /businesses/slug/:slug)
    // Guards will enforce tenant presence on protected routes
    next();
  }
}
