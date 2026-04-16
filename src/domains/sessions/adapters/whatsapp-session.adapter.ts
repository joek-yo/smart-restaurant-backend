// 📁 src/domains/sessions/adapters/whatsapp-session.adapter.ts

import { Injectable, Logger } from '@nestjs/common';
import { SessionEntity } from '../entities/session.entity';

@Injectable()
export class WhatsAppSessionAdapter {
  private readonly logger = new Logger(WhatsAppSessionAdapter.name);

  /**
   * Send cart update message
   */
  async sendCartUpdate(session: SessionEntity): Promise<void> {
    try {
      const message = this.buildCartMessage(session);

      // 🔗 TODO: integrate with Notification Domain (WABA / fallback)
      this.logger.log(`Sending WhatsApp cart update to ${session.userId}`);
      this.logger.debug(message);

      // Example:
      // await this.notificationService.send({
      //   recipient: session.userId,
      //   payload: message,
      //   type: 'CART_UPDATE',
      // });

    } catch (error) {
      this.logger.error('Failed to send cart update', error);
      throw error;
    }
  }

  /**
   * Send checkout confirmation
   */
  async sendCheckoutConfirmation(session: SessionEntity): Promise<void> {
    try {
      const message = this.buildCheckoutMessage(session);

      this.logger.log(`Sending checkout confirmation to ${session.userId}`);
      this.logger.debug(message);

    } catch (error) {
      this.logger.error('Failed to send checkout confirmation', error);
      throw error;
    }
  }

  /**
   * Send abandoned cart reminder
   */
  async sendAbandonedCartReminder(session: SessionEntity): Promise<void> {
    try {
      const message = `You left items in your cart 🛒. Complete your order now!`;

      this.logger.log(`Sending abandoned cart reminder to ${session.userId}`);
      this.logger.debug(message);

    } catch (error) {
      this.logger.error('Failed to send abandoned cart reminder', error);
      throw error;
    }
  }

  /**
   * Build cart message
   */
  private buildCartMessage(session: SessionEntity): string {
    const items = session.items
      .map(i => `${i.name} x${i.quantity} = ${i.total}`)
      .join('\n');

    return `🛒 Your Cart:\n${items}\n\nTotal: ${session.totalAmount}`;
  }

  /**
   * Build checkout message
   */
  private buildCheckoutMessage(session: SessionEntity): string {
    return `✅ Order Confirmed!\nTotal: ${session.totalAmount}\nThank you for your order!`;
  }
}