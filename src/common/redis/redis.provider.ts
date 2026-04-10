// src/common/redis/redis.provider.ts

import Redis from 'ioredis';

export const RedisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    return new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
    });
  },
};