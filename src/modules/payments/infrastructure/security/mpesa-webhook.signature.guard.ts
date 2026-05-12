// src/modules/payments/infrastructure/security/mpesa-webhook.signature.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class MpesaWebhookSignatureGuard implements CanActivate {
  /**
   * NOTE:
   * In production, move these to ConfigService (.env)
   */
  private readonly allowedIps = [
    '196.201.214.200',
    '196.201.214.206',
    '196.201.213.114',
  ];

  private readonly webhookSecret =
    process.env.MPESA_WEBHOOK_SECRET || '';

  /**
   * Reject webhook if older than 5 minutes (replay protection baseline)
   */
  private readonly maxAllowedAgeMs = 5 * 60 * 1000;

  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();

    this.validatePayload(req);
    this.validateIp(req);

    // signature only if configured
    if (this.webhookSecret) {
      this.validateSignature(req);
    }

    this.validateReplayWindow(req);

    return true;
  }

  // =====================================================
  // 🌐 IP VALIDATION
  // =====================================================
  private validateIp(req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string)
        ?.split(',')[0]
        ?.trim() ||
      req.socket.remoteAddress;

    if (!ip) {
      throw new UnauthorizedException('Missing IP address');
    }

    if (
      this.allowedIps.length &&
      !this.allowedIps.includes(ip)
    ) {
      throw new UnauthorizedException(`IP not allowed: ${ip}`);
    }
  }

  // =====================================================
  // 🔐 SIGNATURE VALIDATION (RAW BODY REQUIRED)
  // =====================================================
  private validateSignature(req: Request) {
    const signature = req.headers['x-mpesa-signature'] as string;

    if (!signature) {
      throw new UnauthorizedException('Missing MPESA signature');
    }

    /**
     * IMPORTANT:
     * Nest must be configured to expose rawBody
     * (otherwise this will fail silently)
     */
    const rawBody = (req as any).rawBody;

    if (!rawBody) {
      throw new UnauthorizedException(
        'Missing raw body for signature verification',
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  // =====================================================
  // 📦 BASIC PAYLOAD VALIDATION
  // =====================================================
  private validatePayload(req: Request) {
    const body = req.body;

    if (!body) {
      throw new UnauthorizedException('Empty webhook payload');
    }

    const isValid =
      body?.Body?.stkCallback ||
      body?.ResultCode !== undefined ||
      body?.TransactionID;

    if (!isValid) {
      throw new UnauthorizedException(
        'Invalid MPESA payload structure',
      );
    }
  }

  // =====================================================
  // 🔁 REPLAY ATTACK PROTECTION (TIME WINDOW)
  // =====================================================
  private validateReplayWindow(req: Request) {
    const body = req.body;

    const timestamp =
      body?.Body?.stkCallback?.Timestamp ||
      body?.Timestamp;

    if (!timestamp) return;

    const eventTime = new Date(timestamp).getTime();
    const now = Date.now();

    if (Number.isNaN(eventTime)) return;

    const age = now - eventTime;

    if (age > this.maxAllowedAgeMs) {
      throw new UnauthorizedException(
        'Replay attack detected: stale webhook rejected',
      );
    }
  }
}