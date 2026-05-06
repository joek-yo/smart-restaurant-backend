// 📁 src/domains/menu/events/restaurant-settings-updated.event.ts

export class CatalogSettingsUpdatedEvent {
  constructor(
    public readonly settings: any,
    public readonly businessId: string,
  ) {}
}