// src/core/tenant/tenant.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest();

    if (!request.tenant) {
      throw new UnauthorizedException(
        'Tenant not resolved. Provide x-tenant-id or x-tenant-slug header.',
      );
    }

    return true;
  }
}
