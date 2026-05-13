// FILE: src/modules/conversation/infrastructure/queues/queue.manager.ts

import { Injectable, Logger } from '@nestjs/common';

export interface QueueMessage {
  id: string;
  tenantId: string;
  userId: string;
  payload: Record<string, any>;
  timestamp: Date;
  retries?: number;
}

@Injectable()
export class QueueManager {
  private readonly logger = new Logger(QueueManager.name);
  private readonly queues = new Map<string, QueueMessage[]>();

  enqueue(queueName: string, message: QueueMessage): void {
    if (!this.queues.has(queueName)) this.queues.set(queueName, []);
    this.queues.get(queueName)!.push(message);
    this.logger.debug(`[Queue:${queueName}] enqueued ${message.id}`);
  }

  dequeue(queueName: string): QueueMessage | null {
    const q = this.queues.get(queueName);
    if (!q || q.length === 0) return null;
    return q.shift() ?? null;
  }

  size(queueName: string): number {
    return this.queues.get(queueName)?.length ?? 0;
  }
}
