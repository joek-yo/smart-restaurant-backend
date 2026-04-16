// src/domains/menu/handlers/menu-item-updated.handler.ts

import { Injectable } from '@nestjs/common';
import { MenuItemUpdatedEvent } from '../events/menu-item-updated.event';

/**
 * Handles MenuItemUpdatedEvent.
 * Can notify frontend, update caches, or trigger analytics.
 */
@Injectable()
export class MenuItemUpdatedHandler {
  async handle(event: MenuItemUpdatedEvent) {
    const { menuItem } = event;

    // Example: log update (replace with actual logic)
    console.log(`MenuItem updated: ${menuItem.name} (ID: ${menuItem.id})`);

    // TODO: Notify WebSocket clients via gateway
    // TODO: Update cache if needed
    // TODO: Trigger analytics
  }
}