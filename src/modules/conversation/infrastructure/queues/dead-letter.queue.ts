import { Injectable } from '@nestjs/common';
import { QueueManager, QueueMessage } from './queue.manager';

@Injectable()
export class DeadLetterQueue {
  private readonly NAME = 'dead-letter';
  constructor(private readonly manager: QueueManager) {}
  enqueue(msg: QueueMessage) { this.manager.enqueue(this.NAME, msg); }
  size() { return this.manager.size(this.NAME); }
}
