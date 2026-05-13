// FILE: src/modules/protection/application/services/tenant-isolation-guard.service.ts

import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { TenantScopeVO } from '../../domain/value-objects/tenant-scope.vo';

/**
 * TenantIsolationGuardService
 * ---------------------------
 * Hard boundary enforcement layer for multi-tenancy.
 *
 * CORE GUARANTEE:
 * - No cross-tenant access under ANY circumstance
 * - Every workflow, lock, recovery, or query must be scoped
 *
 * This is a SECURITY CRITICAL component.
 */

@Injectable()
export class TenantIsolationGuardService {
  private readonly logger = new Logger(TenantIsolationGuardService.name);

  // ─────────────────────────────────────────────
  // VALIDATE SCOPE MATCH
  // ─────────────────────────────────────────────
  assertTenantAccess(
    requestTenantId: string,
    resourceTenantId: string,
    context?: {
      userId?: string;
      traceId?: string;
      action?: string;
    },
  ): void {
    const requestScope = new TenantScopeVO(requestTenantId);
    const resourceScope = new TenantScopeVO(resourceTenantId);

    if (requestScope.value !== resourceScope.value) {
      this.logger.error(
        `[TENANT_VIOLATION] requestTenant=${requestScope.value} resourceTenant=${resourceScope.value} ` +
        `user=${context?.userId ?? 'unknown'} action=${context?.action ?? 'unknown'} trace=${context?.traceId ?? 'none'}`,
      );

      throw new ForbiddenException(
        'Tenant isolation violation detected',
      );
    }
  }

  // ─────────────────────────────────────────────
  // SAFE WRAPPER EXECUTION
  // ─────────────────────────────────────────────
  async executeWithinTenant<T>(
    requestTenantId: string,
    resourceTenantId: string,
    handler: () => Promise<T>,
    context?: {
      userId?: string;
      traceId?: string;
      action?: string;
    },
  ): Promise<T> {
    this.assertTenantAccess(
      requestTenantId,
      resourceTenantId,
      context,
    );

    return handler();
  }

  // ─────────────────────────────────────────────
  // SOFT CHECK (non-blocking validation)
  // ─────────────────────────────────────────────
  validateOrWarn(
    requestTenantId: string,
    resourceTenantId: string,
    context?: {
      userId?: string;
      traceId?: string;
      action?: string;
    },
  ): boolean {
    const safe =
      requestTenantId === resourceTenantId;

    if (!safe) {
      this.logger.warn(
        `[TENANT_SUSPICIOUS] requestTenant=${requestTenantId} resourceTenant=${resourceTenantId} ` +
        `user=${context?.userId ?? 'unknown'} action=${context?.action ?? 'unknown'}`,
      );
    }

    return safe;
  }
}