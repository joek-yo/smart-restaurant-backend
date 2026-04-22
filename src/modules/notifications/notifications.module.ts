// src/modules/notifications/notifications.module.ts

import { Module } from '@nestjs/common';
import { CoreEventModule } from '@core/events';
import { OrderEventsListener } from './listeners/order-events.listener';
import { BusinessEventsListener } from './listeners/business-events.listener';

@Module({
  imports: [CoreEventModule],
  providers: [
    OrderEventsListener,
    BusinessEventsListener,
  ],
})
export class NotificationsModule {}