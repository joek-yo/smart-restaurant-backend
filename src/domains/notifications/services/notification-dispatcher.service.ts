// src/domains/notifications/services/notification-dispatcher.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '../entities/notification.entity';
import { NotificationRouterService } from './notification-router.service';
import { NotificationLoggerService } from './notification-logger.service';

// Handlers
import { SendWabaHandler } from '../handlers/whatsapp/send-waba.handler';
import { SendWebHandler } from '../handlers/whatsapp/send-web.handler';
import { SendSmsHandler } from '../handlers/sms/send-sms.handler';
import { SendEmailHandler } from '../handlers/email/send-email.handler';
import { SendPushHandler } from '../handlers/push/send-push.handler';

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    private readonly router: NotificationRouterService,
    private readonly loggerService: NotificationLoggerService,

    // Handlers
    private readonly wabaHandler: SendWabaHandler,
    private readonly webHandler: SendWebHandler,
    private readonly smsHandler: SendSmsHandler,
    private readonly emailHandler: SendEmailHandler,
    private readonly pushHandler: SendPushHandler,
  ) {}

  async dispatch(notification: Notification): Promise<void> {
    this.logger.log(`Dispatching notification → ${notification.recipient}`);

    const route = this.router.route(notification);

    this.logger.log(`Routing decision → ${route.provider} (${route.channel})`);

    try {
      await this.executeHandler(route.provider, notification);

      await this.loggerService.markSent(notification);

      this.logger.log(`Notification successfully sent → ${notification.recipient}`);
    } catch (error) {
      // ✅ Cast error as any
      await this.loggerService.markFailed(notification, (error as any).message);

      this.logger.error(
        `Notification failed → ${notification.recipient}`,
        (error as any).stack,
      );

      throw error; // propagate for retry engine
    }
  }

  private async executeHandler(provider: string, notification: Notification): Promise<void> {
    switch (provider) {
      case 'WABA':
        return this.wabaHandler.send(notification);
      case 'WEB':
        return this.webHandler.send(notification);
      case 'SMS':
        return this.smsHandler.send(notification);
      case 'EMAIL':
        return this.emailHandler.send(notification);
      case 'PUSH':
        return this.pushHandler.send(notification);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}