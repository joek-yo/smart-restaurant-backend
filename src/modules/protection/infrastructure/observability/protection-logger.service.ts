// FILE: src/modules/protection/infrastructure/observability/protection-logger.service.ts

import { Injectable, Logger } from '@nestjs/common';

export type ProtectionLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ProtectionLogEvent {
  level: ProtectionLogLevel;
  component: string;
  action: string;

  tenantId?: string;
  userId?: string;
  traceId?: string;

  metadata?: Record<string, any>;
  timestamp: number;

  durationMs?: number;
}

/**
 * ProtectionLoggerService
 * -----------------------
 * Structured logging layer for:
 * - workflow protection
 * - recovery flows
 * - lock contention
 * - idempotency issues
 *
 * Provides consistent observability across ALL protection services.
 */
@Injectable()
export class ProtectionLoggerService {
  private readonly logger = new Logger(ProtectionLoggerService.name);

  private readonly MAX_BUFFER = 2000;
  private readonly buffer: ProtectionLogEvent[] = [];

  // ─────────────────────────────────────────────
  // CORE LOG METHOD
  // ─────────────────────────────────────────────
  log(
    level: ProtectionLogLevel,
    component: string,
    action: string,
    opts?: {
      tenantId?: string;
      userId?: string;
      traceId?: string;
      metadata?: Record<string, any>;
      durationMs?: number;
    },
  ): void {
    const event: ProtectionLogEvent = {
      level,
      component,
      action,
      tenantId: opts?.tenantId,
      userId: opts?.userId,
      traceId: opts?.traceId,
      metadata: opts?.metadata,
      durationMs: opts?.durationMs,
      timestamp: Date.now(),
    };

    if (this.buffer.length >= this.MAX_BUFFER) {
      this.buffer.shift();
    }

    this.buffer.push(event);

    const msg = [
      `[${component}]`,
      action,
      opts?.tenantId ? `tenant=${opts.tenantId}` : '',
      opts?.userId ? `user=${opts.userId}` : '',
      opts?.traceId ? `trace=${opts.traceId}` : '',
      opts?.durationMs != null ? `duration=${opts.durationMs}ms` : '',
    ]
      .filter(Boolean)
      .join(' ');

    switch (level) {
      case 'debug':
        this.logger.debug(msg);
        break;
      case 'info':
        this.logger.log(msg);
        break;
      case 'warn':
        this.logger.warn(msg);
        break;
      case 'error':
        this.logger.error(msg);
        break;
    }
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  info(component: string, action: string, opts?: any) {
    this.log('info', component, action, opts);
  }

  warn(component: string, action: string, opts?: any) {
    this.log('warn', component, action, opts);
  }

  error(component: string, action: string, opts?: any) {
    this.log('error', component, action, opts);
  }

  debug(component: string, action: string, opts?: any) {
    this.log('debug', component, action, opts);
  }

  // ─────────────────────────────────────────────
  // QUERY API (DEBUGGING / FORENSICS)
  // ─────────────────────────────────────────────
  recent(limit = 50): ProtectionLogEvent[] {
    return this.buffer.slice(-limit);
  }

  byTenant(tenantId: string, limit = 50): ProtectionLogEvent[] {
    return this.buffer
      .filter(e => e.tenantId === tenantId)
      .slice(-limit);
  }

  byTrace(traceId: string): ProtectionLogEvent[] {
    return this.buffer.filter(e => e.traceId === traceId);
  }

  errors(limit = 50): ProtectionLogEvent[] {
    return this.buffer
      .filter(e => e.level === 'error')
      .slice(-limit);
  }
}