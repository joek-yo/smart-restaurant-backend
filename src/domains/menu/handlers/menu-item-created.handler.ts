// src/domains/menu/handlers/menu-item-created.handler.ts

import { Injectable } from '@nestjs/common';
import { MenuItemCreatedEvent } from '../events/menu-item-created.event';

/**
 * Handles MenuItemCreatedEvent.
 * Can notify frontend, update search indexes, or trigger analytics.
 */
@Injectable()
export class MenuItemCreatedHandler {
  async handle(event: MenuItemCreatedEvent) {
    const { menuItem } = event;

    // Example: log creation (replace with actual logic)
    console.log(`MenuItem created: ${menuItem.name} (ID: ${menuItem.id})`);

    // TODO: Notify WebSocket clients via gateway
    // TODO: Update search index if needed
    // TODO: Trigger analytics
  }
}