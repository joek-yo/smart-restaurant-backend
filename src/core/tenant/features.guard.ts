// src/core/tenant/features.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const FEATURE_KEY = 'feature';
export const RequireFeature = (feature: string) => SetMetadata(FEATURE_KEY, feature);

@Injectable()
export class FeaturesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const feature = this.reflector.get<string>(FEATURE_KEY, ctx.getHandler());
    if (!feature) return true; // no feature required — allow

    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant;

    if (!tenant) return true; // no tenant — let TenantGuard handle

    const features = tenant.features || {};

    if (!features[feature]) {
      throw new ForbiddenException(
        `Feature "${feature}" is not enabled for this business.`,
      );
    }

    return true;
  }
}
