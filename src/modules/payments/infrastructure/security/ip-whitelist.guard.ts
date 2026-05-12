// src/modules/payments/infrastructure/security/ip-whitelist.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * IP Whitelist Guard
 * ---------------------------------------------
 * Purpose:
 * - Blocks all requests not originating from allowed MPESA IPs
 * - Acts as FIRST firewall layer for webhook endpoint
 *
 * IMPORTANT:
 * - IP filtering is NOT sufficient alone (must combine with signature + replay protection)
 * - MPESA IP ranges may change; keep this configurable via environment/config service
 */

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  /**
   * NOTE:
   * These are placeholder MPESA/Safaricom IPs.
   * Replace with official updated ranges from Safaricom docs.
   */
  private readonly allowedIps: string[] = [
    '196.201.214.200',
    '196.201.214.206',
    '196.201.213.114',
  ];

  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();

    const ip = this.extractClientIp(req);

    if (!ip) {
      throw new ForbiddenException('Unable to determine client IP');
    }

    if (!this.isAllowed(ip)) {
      throw new ForbiddenException(`IP blocked: ${ip}`);
    }

    return true;
  }

  /**
   * Extracts real client IP (handles proxies / load balancers)
   */
  private extractClientIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];

    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }

    return req.socket?.remoteAddress || null;
  }

  /**
   * Checks if IP is in whitelist
   */
  private isAllowed(ip: string): boolean {
    return this.allowedIps.includes(ip);
  }
}