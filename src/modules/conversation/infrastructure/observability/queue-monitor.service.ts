// FILE: src/modules/conversation/infrastructure/observability/queue-monitor.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { QueueManager } from '../queues/queue.manager';

export interface QueueSnapshot {
  name: string;
  size: number;
  timestamp: number;
}

export interface QueueAlert {
  queue: string;
  size: number;
  threshold: number;
  timestamp: number;
}

@Injectable()
export class QueueMonitorService {
  private readonly logger = new Logger(QueueMonitorService.name);

  private readonly QUEUES_TO_MONITOR = [
    'inbound-messages',
    'outbound-messages',
    'dead-letter',
  ];

  private readonly ALERT_THRESHOLD = 50;
  private readonly snapshots: QueueSnapshot[] = [];
  private readonly alerts: QueueAlert[] = [];
  private readonly MAX = 500;

  constructor(private readonly queueManager: QueueManager) {}

  // ─── TAKE SNAPSHOT ───────────────────────────────────────
  snapshot(): QueueSnapshot[] {
    const now = Date.now();
    const result: QueueSnapshot[] = [];

    for (const name of this.QUEUES_TO_MONITOR) {
      const size = this.queueManager.size(name);
      const snap: QueueSnapshot = { name, size, timestamp: now };

      if (this.snapshots.length >= this.MAX) this.snapshots.shift();
      this.snapshots.push(snap);
      result.push(snap);

      // Alert on backlog
      if (size >= this.ALERT_THRESHOLD) {
        const alert: QueueAlert = {
          queue: name,
          size,
          threshold: this.ALERT_THRESHOLD,
          timestamp: now,
        };
        this.alerts.push(alert);
        this.logger.warn(
          `[QueueMonitor] BACKLOG ALERT queue=${name} size=${size} threshold=${this.ALERT_THRESHOLD}`,
        );
      }

      if (size > 0) {
        this.logger.debug(`[QueueMonitor] queue=${name} size=${size}`);
      }
    }

    return result;
  }

  // ─── CURRENT SIZES ───────────────────────────────────────
  currentSizes(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const name of this.QUEUES_TO_MONITOR) {
      result[name] = this.queueManager.size(name);
    }
    return result;
  }

  // ─── RECENT ALERTS ───────────────────────────────────────
  recentAlerts(limit = 10): QueueAlert[] {
    return this.alerts.slice(-limit);
  }
}
