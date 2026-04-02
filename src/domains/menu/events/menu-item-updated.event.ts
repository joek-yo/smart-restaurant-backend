// src/domains/menu/events/menu-item-updated.event.ts

import { MenuItem } from '../entities/menu-item.entity';

export class MenuItemUpdatedEvent {
  constructor(public readonly menuItem: MenuItem) {}
}