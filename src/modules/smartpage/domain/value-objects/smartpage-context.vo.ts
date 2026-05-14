// FILE: src/modules/smartpage/domain/value-objects/smartpage-context.vo.ts

/**
 * SmartPageContextVO
 * ---------------------------------------------------
 * CANONICAL RUNTIME CONTEXT FOR RENDERING SMARTPAGES
 *
 * This is the SINGLE SOURCE OF TRUTH for:
 * - personalization
 * - visibility rules
 * - block rendering
 * - AI recommendations
 * - cart/checkout awareness
 *
 * Every SmartPage render MUST pass through this object.
 *
 * It is intentionally READ-ONLY (immutable pattern).
 */

import { ConversationState } from '@modules/conversation/domain/enums/conversation-state.enum';

export type SmartPageChannel =
  | 'web'
  | 'whatsapp'
  | 'telegram'
  | 'mobile'
  | 'unknown';

export type SmartPageDevice =
  | 'desktop'
  | 'mobile'
  | 'tablet'
  | 'unknown';

export interface SmartPageCheckoutState {
  active: boolean;
  sessionId?: string;
  step?: 'cart' | 'checkout' | 'payment' | 'confirmed';
}

export interface SmartPageSessionState {
  sessionId?: string;
  hasCart: boolean;
  cartItemCount: number;
  cartTotal?: number;
}

export interface SmartPageContextProps {
  tenantId: string;
  userId: string;

  // session layer
  session: SmartPageSessionState;

  // conversation layer (bridge to chat engine)
  conversationState: ConversationState;

  // checkout layer (bridge to checkout engine)
  checkout: SmartPageCheckoutState;

  // environment
  channel: SmartPageChannel;
  device: SmartPageDevice;

  // optional runtime flags
  isAuthenticated?: boolean;
  isReturningUser?: boolean;

  // feature flags (from Business.features)
  features?: Record<string, boolean>;

  // timing context
  timestamp?: number;
}

export class SmartPageContextVO {
  public readonly tenantId: string;
  public readonly userId: string;

  public readonly session: SmartPageSessionState;
  public readonly conversationState: ConversationState;
  public readonly checkout: SmartPageCheckoutState;

  public readonly channel: SmartPageChannel;
  public readonly device: SmartPageDevice;

  public readonly isAuthenticated: boolean;
  public readonly isReturningUser: boolean;

  public readonly features: Record<string, boolean>;
  public readonly timestamp: number;

  constructor(props: SmartPageContextProps) {
    this.tenantId = props.tenantId;
    this.userId = props.userId;

    this.session = Object.freeze({ ...props.session });
    this.conversationState = props.conversationState;
    this.checkout = Object.freeze({ ...props.checkout });

    this.channel = props.channel;
    this.device = props.device;

    this.isAuthenticated = props.isAuthenticated ?? false;
    this.isReturningUser = props.isReturningUser ?? false;

    this.features = Object.freeze(props.features ?? {});
    this.timestamp = props.timestamp ?? Date.now();
  }

  // ==================================================
  // 🧠 DERIVED HELPERS (USED BY VISIBILITY ENGINE)
  // ==================================================

  get hasCart(): boolean {
    return this.session.hasCart;
  }

  get isCheckoutActive(): boolean {
    return this.checkout.active;
  }

  get cartItemCount(): number {
    return this.session.cartItemCount;
  }

  get isGuest(): boolean {
    return !this.isAuthenticated;
  }

  get isWeb(): boolean {
    return this.channel === 'web';
  }

  get isWhatsApp(): boolean {
    return this.channel === 'whatsapp';
  }

  // ==================================================
  // 🧩 FEATURE FLAG CHECK
  // ==================================================

  hasFeature(feature: string): boolean {
    return !!this.features?.[feature];
  }
}