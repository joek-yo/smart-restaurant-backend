// FILE: src/modules/payments/domain/value-objects/provider.vo.ts

/**
 * PaymentProviderVO
 * ------------------
 * Defines supported payment providers in the system.
 *
 * DESIGN GOAL:
 * - Keep provider logic OUT of domain
 * - Domain only sees "provider type", not implementation
 * - Enables swapping Mpesa / Stripe / Aggregators without breaking core logic
 */

export enum PaymentProvider {
  MPESA = 'MPESA',        // 🇰🇪 Primary (STK Push, B2C, C2B)
  STRIPE = 'STRIPE',      // 🌍 Global card payments
  AGGREGATOR = 'AGGREGATOR', // 🧠 Future: unified routing layer
}

export class ProviderVO {
  private readonly _value: PaymentProvider;

  constructor(value: PaymentProvider) {
    if (!Object.values(PaymentProvider).includes(value)) {
      throw new Error(`Invalid PaymentProvider: ${value}`);
    }

    this._value = value;
  }

  get value(): PaymentProvider {
    return this._value;
  }

  // =====================================================
  // 🧠 PROVIDER CAPABILITIES (IMPORTANT FOR ORCHESTRATION)
  // =====================================================

  isMpesa(): boolean {
    return this._value === PaymentProvider.MPESA;
  }

  isStripe(): boolean {
    return this._value === PaymentProvider.STRIPE;
  }

  isAggregator(): boolean {
    return this._value === PaymentProvider.AGGREGATOR;
  }

  // =====================================================
  // 🚀 ROUTING TAGS (used by orchestrator)
  // =====================================================

  supportsRealtimeCallbacks(): boolean {
    return this.isMpesa() || this.isStripe();
  }

  requiresPolling(): boolean {
    return this.isAggregator();
  }

  // =====================================================
  // 🧩 FUTURE EXTENSION HOOK
  // =====================================================
  static fromString(value: string): ProviderVO {
    switch (value.toUpperCase()) {
      case 'MPESA':
        return new ProviderVO(PaymentProvider.MPESA);
      case 'STRIPE':
        return new ProviderVO(PaymentProvider.STRIPE);
      case 'AGGREGATOR':
        return new ProviderVO(PaymentProvider.AGGREGATOR);
      default:
        throw new Error(`Unknown provider: ${value}`);
    }
  }
}