// src/modules/channels/application/listeners/delivery-failed.listener.ts

import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@core/events';
import { WHATSAPP_EVENTS } from '@core/events/event.constants';

import { WhatsAppRetryService } from '../services/whatsapp-retry.service';
import { WhatsAppDeliveryService } from '../services/whatsapp-delivery.service';

@Injectable()
export class DeliveryFailedListener {
  private readonly logger = new Logger(DeliveryFailedListener.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly retryService: WhatsAppRetryService,
    private readonly deliveryService: WhatsAppDeliveryService,
  ) {
    this.registerListeners();
  }

  private registerListeners() {
    this.eventBus.on(WHATSAPP_EVENTS.WHATSAPP_DELIVERY_FAILED, async (payload) => {
      await this.handleFailure(payload);
    });
  }

  private async handleFailure(payload: {
    tenantId: string;
    userId: string;
    phone: string;
    message: string;
    error?: any;
    attempt?: number;
  }) {
    const attempt = payload.attempt ?? 1;

    this.logger.error(
      `[WHATSAPP DELIVERY FAILED] to=${payload.phone} attempt=${attempt}`,
      payload.error,
    );

    if (attempt < 3) {
      await this.retryService.execute(async () => {
        return this.deliveryService.send({
          to: payload.phone,
          tenantId: payload.tenantId,
          message: payload.message,
          metadata: {
            retry: attempt + 1,
            reason: 'delivery_failure_recovery',
          },
        });
      });
      return;
    }

    this.eventBus.emit(WHATSAPP_EVENTS.WHATSAPP_DELIVERY_DEAD_LETTER, {
      tenantId: payload.tenantId,
      userId: payload.userId,
      phone: payload.phone,
      message: payload.message,
      error: payload.error,
    });

    this.logger.warn(
      `[WHATSAPP DEAD LETTER] to=${payload.phone} after ${attempt} attempts`,
    );
  }
}
