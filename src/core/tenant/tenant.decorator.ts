// src/core/tenant/tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the resolved tenant (Business) from the request.
 * Usage: @Tenant() business: BusinessDocument
 */
export const Tenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);
