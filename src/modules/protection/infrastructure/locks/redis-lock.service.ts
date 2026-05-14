import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RedisLockService {
  private readonly logger = new Logger(RedisLockService.name);
  private readonly locks = new Map<string, NodeJS.Timeout>();

  async acquire(key: string, ttlSeconds: number): Promise<boolean> {
    if (this.locks.has(key)) return false;
    const timer = setTimeout(() => { this.locks.delete(key); }, ttlSeconds * 1000);
    this.locks.set(key, timer);
    return true;
  }

  async release(key: string): Promise<void> {
    const timer = this.locks.get(key);
    if (timer) { clearTimeout(timer); this.locks.delete(key); }
  }

  async isLocked(key: string): Promise<boolean> {
    return this.locks.has(key);
  }

  async extend(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.locks.has(key)) return false;
    const timer = this.locks.get(key)!;
    clearTimeout(timer);
    const newTimer = setTimeout(() => { this.locks.delete(key); }, ttlSeconds * 1000);
    this.locks.set(key, newTimer);
    return true;
  }

  async exists(key: string): Promise<boolean> {
    return this.locks.has(key);
  }

  async forceRelease(key: string): Promise<void> {
    await this.release(key);
  }
}
