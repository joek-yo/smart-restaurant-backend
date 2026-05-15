// FILE: src/modules/truth-engine/domain/truth.types.ts

/**
 * =====================================================
 * 🧠 TRUTH ENGINE — CORE TYPE LANGUAGE
 * =====================================================
 *
 * This file defines the canonical type system for the Truth Engine.
 * Everything in the system (adapters, cache, builder, computation)
 * MUST conform to these contracts.
 *
 * NO business logic lives here.
 * ONLY type definitions and structural contracts.
 * =====================================================
 */

/**
 * =====================================================
 * 🧾 CORE IDENTIFIERS
 * =====================================================
 */
export type TenantId = string;
export type SessionId = string;
export type UserId = string;

/**
 * =====================================================
 * 📦 SOURCE OF TRUTH ENUM
 * =====================================================
 * Defines where a piece of truth originated from.
 */
export enum TruthSourceType {
  DATABASE = 'database',
  CACHE = 'cache',
  EVENT = 'event',
  ADAPTER = 'adapter',
  COMPUTED = 'computed',
}

/**
 * =====================================================
 * 🧠 GENERIC ENTITY MAPS (RAW DOMAIN INPUTS)
 * =====================================================
 */

export interface BusinessTruth {
  id: string;
  name: string;
  slug?: string;
  currency?: string;
  timezone?: string;
  isActive?: boolean;

  storefront?: Record<string, any>;
  features?: Record<string, any>;
}

export interface SessionTruth {
  id: string;
  tenantId: string;
  userId: string;

  state?: string;

  items?: Array<{
    productId: string;
    name?: string;
    price?: number;
    quantity: number;
  }>;

  subtotal?: number;
  total?: number;

  expiresAt?: Date;
  updatedAt?: Date;
}

export interface CatalogTruth {
  products: Array<{
    id: string;
    name: string;
    price: number;
    categoryId?: string;
    stock?: number;
    isOutOfStock?: boolean;
  }>;

  categories: Array<{
    id: string;
    name: string;
  }>;
}

export interface ConversationTruth {
  state?: string;

  memory?: Record<string, any>;

  lastMessage?: string;

  intent?: string;

  recoveryMarker?: {
    retryCount?: number;
    reason?: string;
  };
}

/**
 * =====================================================
 * 🧠 COMBINED TRUTH SNAPSHOT (CORE OUTPUT)
 * =====================================================
 *
 * This is the FINAL object consumed by:
 * - SmartPage engine
 * - AI context layer
 * - analytics engine
 * - follow-up engine
 */
export interface TruthSnapshot {
  tenantId: TenantId;
  sessionId: SessionId;
  userId: UserId;

  business: BusinessTruth | null;
  session: SessionTruth | null;
  catalog: CatalogTruth | null;
  conversation: ConversationTruth | null;

  /**
   * Computed intelligence layer (no raw DB)
   */
  computed?: {
    cartItemCount?: number;
    cartTotal?: number;

    isCheckoutActive?: boolean;
    isReturningUser?: boolean;

    engagementScore?: number;

    intentSignals?: string[];
  };

  /**
   * Traceability metadata
   */
  meta: {
    generatedAt: Date;
    sourceMap: Record<string, TruthSourceType>;
    cacheHit: boolean;
    version: number;
  };
}

/**
 * =====================================================
 * ⚙️ ADAPTER CONTRACTS
 * =====================================================
 */

export interface TruthAdapter<TInput = any, TOutput = any> {
  fetch(input: TInput): Promise<TOutput>;
}

/**
 * Business Adapter
 */
export interface BusinessAdapterInput {
  tenantId: string;
}

export type BusinessAdapterOutput = BusinessTruth;

/**
 * Session Adapter
 */
export interface SessionAdapterInput {
  tenantId: string;
  sessionId: string;
  userId: string;
}

export type SessionAdapterOutput = SessionTruth;

/**
 * Catalog Adapter
 */
export interface CatalogAdapterInput {
  tenantId: string;
}

export type CatalogAdapterOutput = CatalogTruth;

/**
 * Conversation Adapter
 */
export interface ConversationAdapterInput {
  tenantId: string;
  userId: string;
}

export type ConversationAdapterOutput = ConversationTruth;

/**
 * =====================================================
 * 🧠 CACHE KEY CONTRACT
 * =====================================================
 */

export interface TruthCacheKey {
  tenantId: string;
  sessionId: string;
  userId: string;
  version?: number;
}

/**
 * Serialized cache key format
 */
export type TruthCacheKeyString = string;

/**
 * =====================================================
 * 📡 EVENT MAPPING (FOR INVALIDATION LAYER)
 * =====================================================
 */

export type TruthInvalidationEvent =
  | 'session.updated'
  | 'session.created'
  | 'session.deleted'
  | 'product.updated'
  | 'product.created'
  | 'product.deleted'
  | 'category.updated'
  | 'category.created'
  | 'category.deleted'
  | 'business.updated'
  | 'conversation.state.changed';

/**
 * Event payload contract (flexible but traceable)
 */
export interface TruthEventPayload {
  tenantId?: string;
  sessionId?: string;
  userId?: string;

  entityType: 'session' | 'business' | 'product' | 'category' | 'conversation';

  entityId?: string;

  data?: any;
}