// src/domains/menu/events/menu-item-created.event.ts

import { MenuItem } from '../entities/menu-item.entity';

export class MenuItemCreatedEvent {
  constructor(public readonly menuItem: MenuItem) {}
}