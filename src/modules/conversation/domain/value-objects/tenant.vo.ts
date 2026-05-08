/**
 * TenantVO
 * ---------
 * Strong isolation boundary for multi-tenancy.
 * Prevents accidental cross-tenant leakage in the conversation engine.
 */
export class TenantVO {
  constructor(
    public readonly tenantId: string,
    public readonly businessId: string,
    public readonly slug?: string,
    public readonly domain?: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.tenantId) {
      throw new Error('TenantVO: tenantId is required');
    }
    if (!this.businessId) {
      throw new Error('TenantVO: businessId is required');
    }
  }

  /**
   * Helper to check if two tenants are identical
   */
  equals(other: TenantVO): boolean {
    return this.tenantId === other.tenantId && this.businessId === other.businessId;
  }
}
