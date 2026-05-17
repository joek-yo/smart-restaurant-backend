// 📁 src/domains/menu/events/catalog-settings-updated.event.ts

export class CatalogSettingsUpdatedEvent {
  constructor(
    public readonly settings: any,
    public readonly businessId: string,
  ) {}
}