// src/infrastructure/notifications/providers/push.provider.ts

import { Injectable, Logger } from '@nestjs/common';

/**
 * PushProvider
 *
 * 🔥 INFRASTRUCTURE LAYER
 *
 * Handles push notification delivery via external services
 * (Firebase, OneSignal, Expo, etc.)
 *
 * Currently: Mock implementation
 * Future: Plug real provider (FCM / OneSignal)
 */
@Injectable()
export class PushProvider {
  private readonly logger = new Logger(PushProvider.name);

  /**
   * Send push notification
   */
  async send(input: {
    to: string;        // device token
    title: string;
    message: string;
  }): Promise<{ success: boolean; provider: string }> {
    try {
      // 🔥 Simulate sending push
      this.logger.log(
        `📲 PUSH → ${input.to} | ${input.title} | ${input.message}`,
      );

      // 👉 Replace this later with Firebase / OneSignal
      // Example:
      // await firebase.messaging().send(...)

      return {
        success: true,
        provider: 'mock-push',
      };
    } catch (error) {
      this.logger.error(
        `❌ Push notification failed → ${input.to}`,
        (error as any).stack,  // ✅ cast error as any
      );

      throw error;
    }
  }
}