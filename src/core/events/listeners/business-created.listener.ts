// src/core/events/listeners/business-created.listener.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '../event.constants';

@Injectable()
export class BusinessCreatedListener {
  private readonly logger = new Logger(BusinessCreatedListener.name);

  @OnEvent(EVENTS.BUSINESS_CREATED)
  handleBusinessCreated(payload: any) {
    this.logger.log(
      `🔥 Business Created Event Received: ${JSON.stringify(payload)}`,
    );
  }
}