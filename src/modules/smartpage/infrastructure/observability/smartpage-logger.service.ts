// src/modules/smartpage/infrastructure/observability/smartpage-logger.service.ts

import { Injectable, Logger } from '@nestjs/common';

/**
 * SmartpageLoggerService
 * ------------------------------------------------------
 * Structured logging layer for SmartPage Engine.
 *
 * Purpose:
 * - Provide consistent logging format across SmartPage modules
 * - Add contextual metadata (tenant, user, page, block)
 * - Enable debugging of rendering pipeline
 * - Support observability + future analytics pipelines
 *
 * IMPORTANT:
 * - Do NOT log business-sensitive data (payment, secrets)
 * - Keep logs structured and queryable
 */

export interface SmartpageLogContext {
  tenantId?: string;
  userId?: string;
  sessionId?: string;

  smartpageId?: string;
  blockId?: string;

  action?: string;
  stage?: string;

  metadata?: Record<string, any>;
}

@Injectable()
export class SmartpageLoggerService {
  private readonly logger = new Logger('SmartPage');

  // ======================================================
  // ℹ️ INFO LOG
  // ======================================================
  info(message: string, context?: SmartpageLogContext): void {
    this.logger.log(this.format(message, context));
  }

  // ======================================================
  // ⚠️ WARNING LOG
  // ======================================================
  warn(message: string, context?: SmartpageLogContext): void {
    this.logger.warn(this.format(message, context));
  }

  // ======================================================
  // ❌ ERROR LOG
  // ======================================================
  error(message: string, context?: SmartpageLogContext, error?: any): void {
    this.logger.error(
      this.format(message, context),
      error?.stack || error,
    );
  }

  // ======================================================
  // 🧠 DEBUG LOG (PIPELINE TRACKING)
  // ======================================================
  debug(message: string, context?: SmartpageLogContext): void {
    if (process.env.SMARTPAGE_DEBUG === 'true') {
      this.logger.debug(this.format(message, context));
    }
  }

  // ======================================================
  // 🔧 FORMATTER (STRUCTURED OUTPUT)
  // ======================================================
  private format(message: string, context?: SmartpageLogContext): string {
    if (!context) return `[SmartPage] ${message}`;

    return JSON.stringify(
      {
        service: 'smartpage',
        message,
        timestamp: new Date().toISOString(),
        ...context,
      },
      null,
      0,
    );
  }
}