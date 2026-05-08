// FILE: src/modules/conversation/infrastructure/redis/redis.keys.ts
export const RedisKeys = {
  conversationContext: (tenantId: string, userId: string) =>
    `conv:${tenantId}:${userId}:context`,

  conversationMeta: (tenantId: string, userId: string) =>
    `conv:${tenantId}:${userId}:meta`,

  cartSnapshot: (tenantId: string, userId: string) =>
    `conv:${tenantId}:${userId}:cart`,

  intentCache: (tenantId: string, userId: string) =>
    `conv:${tenantId}:${userId}:intent`,

  stateLock: (tenantId: string, userId: string) =>
    `conv:${tenantId}:${userId}:lock`,

  abandonment: (tenantId: string) =>
    `conv:${tenantId}:abandonment`,

  analyticsStream: (tenantId: string) =>
    `conv:${tenantId}:analytics`,

  /**
   * 🔐 IDEMPOTENCY: Stores response for a specific messageId
   * TTL: 24hrs — covers all WhatsApp retry windows
   * Key: conv:{tenantId}:{userId}:msg:{messageId}
   */
  messageIdempotency: (tenantId: string, userId: string, messageId: string) =>
    `conv:${tenantId}:${userId}:msg:${messageId}`,
};
