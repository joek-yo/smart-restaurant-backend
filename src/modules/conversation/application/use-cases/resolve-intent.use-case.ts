// src/modules/conversation/application/use-cases/resolve-intent.use-case.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class ResolveIntentUseCase {
  execute(message: string): string {
    const text = message.toLowerCase().trim();

    // === CART ACTIONS ===
    if (text.startsWith('add')) return 'ADD_TO_CART';
    if (text.startsWith('remove')) return 'REMOVE_FROM_CART';

    // === CHECKOUT — exact only, never fuzzy ===
    if (text === 'checkout' || text === 'check out') return 'CHECKOUT';
    if (text === 'confirm order' || text === 'confirm') return 'CONFIRM_ORDER';
    if (text === 'cancel' || text === 'cancel order') return 'CANCEL_ORDER';

    // === CART VIEW — exact only ===
    if (
      text === 'cart' ||
      text === 'my cart' ||
      text === 'show cart' ||
      text === 'view cart'
    ) return 'VIEW_CART';

    // === BROWSING ===
    if (
      text === 'menu' ||
      text === 'products' ||
      text === 'show menu' ||
      text.includes('what do you have') ||
      text.includes('what can i order')
    ) return 'VIEW_PRODUCTS';

    // === HELP ===
    if (text === 'help' || text === 'hi' || text === 'hello') return 'ASK_HELP';

    // === SAFE FALLBACK — never triggers business flow ===
    return 'SMALL_TALK';
  }
}
