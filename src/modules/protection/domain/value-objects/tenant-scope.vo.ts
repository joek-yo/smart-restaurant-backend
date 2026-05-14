export class TenantScopeVO {
  constructor(public readonly tenantId: string, public readonly scope: string = 'default') {}

  getValue(): string { return `${this.tenantId}:${this.scope}`; }
  equals(other: TenantScopeVO): boolean { return this.tenantId === other.tenantId && this.scope === other.scope; }
}
