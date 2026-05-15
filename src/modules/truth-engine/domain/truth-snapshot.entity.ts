// FILE: src/modules/truth-engine/domain/truth-snapshot.entity.ts

import {
  TruthSnapshot,
  BusinessTruth,
  SessionTruth,
  CatalogTruth,
  ConversationTruth,
  TruthSourceType,
} from './truth.types';

/**
 * =====================================================
 * 🧠 TRUTH SNAPSHOT ENTITY (IMMUTABLE CORE OBJECT)
 * =====================================================
 *
 * This is the FINAL representation of system truth.
 *
 * Rules:
 * - Cannot be mutated after creation
 * - Can only be constructed via factory
 * - Must remain deterministic across system
 * - Safe for AI + rendering + analytics
 * =====================================================
 */

export class TruthSnapshotEntity implements TruthSnapshot {
  public readonly tenantId: string;
  public readonly sessionId: string;
  public readonly userId: string;

  public readonly business: BusinessTruth | null;
  public readonly session: SessionTruth | null;
  public readonly catalog: CatalogTruth | null;
  public readonly conversation: ConversationTruth | null;

  public readonly computed?: TruthSnapshot['computed'];

  public readonly meta: {
    generatedAt: Date;
    sourceMap: Record<string, TruthSourceType>;
    cacheHit: boolean;
    version: number;
  };

  /**
   * =====================================================
   * 🧱 PRIVATE CONSTRUCTOR (FORCES FACTORY USAGE)
   * =====================================================
   */
  private constructor(snapshot: TruthSnapshot) {
    this.tenantId = snapshot.tenantId;
    this.sessionId = snapshot.sessionId;
    this.userId = snapshot.userId;

    this.business = snapshot.business ?? null;
    this.session = snapshot.session ?? null;
    this.catalog = snapshot.catalog ?? null;
    this.conversation = snapshot.conversation ?? null;

    this.computed = snapshot.computed;

    this.meta = Object.freeze({
      generatedAt: snapshot.meta.generatedAt,
      sourceMap: { ...snapshot.meta.sourceMap },
      cacheHit: snapshot.meta.cacheHit,
      version: snapshot.meta.version,
    });

    // 🔒 HARD IMMUTABILITY ENFORCEMENT (runtime safety)
    Object.freeze(this);
  }

  /**
   * =====================================================
   * 🏗️ FACTORY METHOD (ONLY WAY TO CREATE SNAPSHOT)
   * =====================================================
   */
  static create(snapshot: TruthSnapshot): TruthSnapshotEntity {
    return new TruthSnapshotEntity(snapshot);
  }

  /**
   * =====================================================
   * 🧠 SAFE CLONE (FOR DOWNSTREAM USE ONLY)
   * =====================================================
   *
   * Used when a service needs a mutable copy (never mutate core object).
   */
  clone(): TruthSnapshot {
    return JSON.parse(JSON.stringify(this));
  }

  /**
   * =====================================================
   * 📊 COMPUTED GETTERS (READ-ONLY DERIVED INTELLIGENCE)
   * =====================================================
   */

  get hasSession(): boolean {
    return !!this.session;
  }

  get hasBusiness(): boolean {
    return !!this.business;
  }

  get hasCatalog(): boolean {
    return !!this.catalog;
  }

  get hasConversation(): boolean {
    return !!this.conversation;
  }

  get cartItemCount(): number {
    return this.session?.items?.length ?? 0;
  }

  get cartTotal(): number {
    return this.session?.total ?? 0;
  }

  get isCheckoutActive(): boolean {
    return this.session?.state === 'checkout';
  }

  get isCacheHit(): boolean {
    return this.meta.cacheHit;
  }

  get generatedAt(): Date {
    return this.meta.generatedAt;
  }

  /**
   * =====================================================
   * 🧾 SERIALIZATION (SAFE OUTPUT FOR AI/UI)
   * =====================================================
   */
  toJSON(): TruthSnapshot {
    return {
      tenantId: this.tenantId,
      sessionId: this.sessionId,
      userId: this.userId,

      business: this.business,
      session: this.session,
      catalog: this.catalog,
      conversation: this.conversation,

      computed: this.computed,

      meta: {
        ...this.meta,
        generatedAt: this.meta.generatedAt,
      },
    };
  }
}