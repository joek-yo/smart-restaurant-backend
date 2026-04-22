// src/modules/business/application/listeners/business-created.listener.ts

import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { EVENTS } from '@core/events';

@Injectable()
export class BusinessCreatedListener {
  private readonly logger = new Logger(BusinessCreatedListener.name);

  @OnEvent(EVENTS.BUSINESS_CREATED)
  handle(event: any) {
    this.logger.log(
      `🔥 Business Created Event Received: ${JSON.stringify(event.payload)}`,
    );
  }
}