// FILE: src/modules/conversation/infrastructure/observability/orchestration-logger.service.ts

import { Injectable, Logger } from '@nestjs/common';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface OrchestrationEvent {
  level: LogLevel;
  component: string;
  event: string;
  tenantId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: number;
  durationMs?: number;
}

@Injectable()
export class OrchestrationLoggerService {
  private readonly logger = new Logger(OrchestrationLoggerService.name);
  private readonly MAX = 1000;
  private readonly events: OrchestrationEvent[] = [];

  // ─── LOG ─────────────────────────────────────────────────
  log(
    level: LogLevel,
    component: string,
    event: string,
    opts?: {
      tenantId?: string;
      userId?: string;
      metadata?: Record<string, any>;
      durationMs?: number;
    },
  ): void {
    const entry: OrchestrationEvent = {
      level,
      component,
      event,
      tenantId: opts?.tenantId,
      userId: opts?.userId,
      metadata: opts?.metadata,
      timestamp: Date.now(),
      durationMs: opts?.durationMs,
    };

    if (this.events.length >= this.MAX) this.events.shift();
    this.events.push(entry);

    const msg = [
      `[${component}]`,
      event,
      opts?.tenantId ? `tenant=${opts.tenantId}` : '',
      opts?.userId   ? `user=${opts.userId}`     : '',
      opts?.durationMs != null ? `duration=${opts.durationMs}ms` : '',
    ].filter(Boolean).join(' ');

    switch (level) {
      case 'debug': this.logger.debug(msg); break;
      case 'info':  this.logger.log(msg);   break;
      case 'warn':  this.logger.warn(msg);  break;
      case 'error': this.logger.error(msg); break;
    }
  }

  // ─── SHORTHAND HELPERS ───────────────────────────────────
  info(component: string, event: string, opts?: Parameters<typeof this.log>[3]): void {
    this.log('info', component, event, opts);
  }

  warn(component: string, event: string, opts?: Parameters<typeof this.log>[3]): void {
    this.log('warn', component, event, opts);
  }

  error(component: string, event: string, opts?: Parameters<typeof this.log>[3]): void {
    this.log('error', component, event, opts);
  }

  debug(component: string, event: string, opts?: Parameters<typeof this.log>[3]): void {
    this.log('debug', component, event, opts);
  }

  // ─── QUERY ───────────────────────────────────────────────
  recent(limit = 50): OrchestrationEvent[] {
    return this.events.slice(-limit);
  }

  byLevel(level: LogLevel, limit = 20): OrchestrationEvent[] {
    return this.events.filter(e => e.level === level).slice(-limit);
  }

  byTenant(tenantId: string, limit = 20): OrchestrationEvent[] {
    return this.events.filter(e => e.tenantId === tenantId).slice(-limit);
  }

  errors(limit = 20): OrchestrationEvent[] {
    return this.byLevel('error', limit);
  }
}
