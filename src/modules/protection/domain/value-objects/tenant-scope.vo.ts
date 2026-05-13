// src/modules/protection/domain/value-objects/tenant-scope.vo.ts

/**
 * TenantScopeVO
 * --------------
 * Strict multi-tenant isolation boundary.
 *
 * RULES:
 * - Every protection/recovery operation MUST be scoped to a tenant
 * - Prevents cross-tenant data leakage
 * - Enforces identity isolation at domain level (not just infrastructure)
 */
export class TenantScopeVO {
  private readonly tenantId: string;

  constructor(tenantId: string) {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error('TenantScopeVO cannot be empty');
    }

    this.tenantId = tenantId;
  }

  // ─────────────────────────────────────────────
  // 🔑 ACCESS
  // ─────────────────────────────────────────────

  getValue(): string {
    return this.tenantId;
  }

  toString(): string {
    return this.tenantId;
  }

  // ─────────────────────────────────────────────
  // 🔐 FACTORY
  // ─────────────────────────────────────────────

  static from(tenantId: string): TenantScopeVO {
    return new TenantScopeVO(tenantId);
  }

  // ─────────────────────────────────────────────
  // 🧠 VALIDATION
  // ─────────────────────────────────────────────

  equals(other: TenantScopeVO): boolean {
    return this.tenantId === other.tenantId;
  }

  // ─────────────────────────────────────────────
  // 🔒 SECURITY GUARDS
  // ─────────────────────────────────────────────

  /**
   * Ensures another tenant scope is NOT mixed with this one.
   * Useful for guard clauses in coordinators/services.
   */
  assertSameScope(other: TenantScopeVO): void {
    if (this.tenantId !== other.tenantId) {
      throw new Error(
        `TENANT_SCOPE_VIOLATION: ${this.tenantId} ≠ ${other.tenantId}`,
      );
    }
  }

  /**
   * Helper for safe comparison in workflows
   */
  isSameTenant(tenantId: string): boolean {
    return this.tenantId === tenantId;
  }
}