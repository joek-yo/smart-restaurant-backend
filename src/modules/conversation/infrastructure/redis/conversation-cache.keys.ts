// FILE: src/modules/conversation/infrastructure/redis/conversation-cache.keys.ts

/**
 * Centralized Redis Key Strategy
 * --------------------------------
 * Prevents key chaos across modules and ensures:
 * - predictable caching structure
 * - safe multi-tenant isolation
 * - future sharding support
 */

export class ConversationCacheKeys {
  // =========================
  // 🧠 CORE CONTEXT
  // =========================
  static context(tenantId: string, userId: string): string {
    return `conv:ctx:${tenantId}:${userId}`;
  }

  // =========================
  // 🔁 IDEMPOTENCY (MESSAGE DEDUP)
  // =========================
  static messageIdempotency(
    tenantId: string,
    userId: string,
    messageId: string,
  ): string {
    return `conv:idem:${tenantId}:${userId}:${messageId}`;
  }

  // =========================
  // ⚠️ ABANDONMENT TRACKING
  // =========================
  static abandonment(tenantId: string): string {
    return `conv:abandon:${tenantId}`;
  }

  static abandonedUser(tenantId: string, userId: string): string {
    return `conv:abandon:${tenantId}:${userId}`;
  }

  // =========================
  // 🔄 RECOVERY STATE
  // =========================
  static recovery(tenantId: string, userId: string): string {
    return `conv:recovery:${tenantId}:${userId}`;
  }

  // =========================
  // 📊 OPTIONAL: ANALYTICS HOOK (FUTURE)
  // =========================
  static metrics(tenantId: string): string {
    return `conv:metrics:${tenantId}`;
  }
}