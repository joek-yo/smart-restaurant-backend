// 📁 src/domains/menu/events/restaurant-settings-updated.event.ts

export class RestaurantSettingsUpdatedEvent {
  constructor(
    public readonly settings: any,
    public readonly businessId: string,
  ) {}
}