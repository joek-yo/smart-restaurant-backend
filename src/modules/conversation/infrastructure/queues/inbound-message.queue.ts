import { Injectable } from '@nestjs/common';
import { QueueManager, QueueMessage } from './queue.manager';

@Injectable()
export class InboundMessageQueue {
  private readonly NAME = 'inbound';
  constructor(private readonly manager: QueueManager) {}
  enqueue(msg: QueueMessage) { this.manager.enqueue(this.NAME, msg); }
  dequeue() { return this.manager.dequeue(this.NAME); }
}
