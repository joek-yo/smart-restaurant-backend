// src/modules/conversation/domain/entities/conversation-context.entity.ts
import { ConversationState } from '../enums/conversation-state.enum';
import { ConversationChannel } from '../enums/conversation-channel.enum';

export class ConversationContextEntity {
  public id: string;
  public tenantId: string;
  public userId: string;
  public channel: ConversationChannel;
  public state: ConversationState;
  public memory: Record<string, any>;
  public expiresAt: Date;
  public updatedAt: Date;
  public cart: {
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
  };

  constructor(
    idOrParams:
      | string
      | {
          id: string;
          tenantId: string;
          userId: string;
          channel: ConversationChannel;
          state?: ConversationState;
          cart?: { items: any[]; total: number };
          memory?: Record<string, any>;
          expiresAt?: Date;
          updatedAt?: Date;
        },
    tenantId?: string,
    userId?: string,
    channel?: ConversationChannel,
    state?: ConversationState,
    cart?: { items: any[]; total: number },
    memory?: Record<string, any>,
    expiresAt?: Date,
    updatedAt?: Date,
  ) {
    if (typeof idOrParams === 'object') {
      // Named object style (used by Redis repo)
      this.id = idOrParams.id;
      this.tenantId = idOrParams.tenantId;
      this.userId = idOrParams.userId;
      this.channel = idOrParams.channel;
      this.state = idOrParams.state ?? ConversationState.IDLE;
      this.cart = idOrParams.cart ?? { items: [], total: 0 };
      this.memory = idOrParams.memory ?? {};
      this.expiresAt = idOrParams.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 3);
      this.updatedAt = idOrParams.updatedAt ?? new Date();
    } else {
      // Positional style (used by LoadContextUseCase)
      this.id = idOrParams;
      this.tenantId = tenantId!;
      this.userId = userId!;
      this.channel = channel!;
      this.state = state ?? ConversationState.IDLE;
      this.cart = cart ?? { items: [], total: 0 };
      this.memory = memory ?? {};
      this.expiresAt = expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 3);
      this.updatedAt = updatedAt ?? new Date();
    }
  }

  addItem(item: { productId: string; name: string; quantity: number; price: number }) {
    const existing = this.cart.items.find((i) => i.productId === item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.cart.items.push(item);
    }
    this.recalculateTotal();
    this.touch();
  }

  removeItem(productId: string) {
    this.cart.items = this.cart.items.filter((i) => i.productId !== productId);
    this.recalculateTotal();
    this.touch();
  }

  clearCart() {
    this.cart = { items: [], total: 0 };
    this.touch();
  }

  updateState(newState: ConversationState) {
    this.state = newState;
    this.touch();
  }

  setMemory(key: string, value: any) {
    this.memory[key] = value;
    this.touch();
  }

  private recalculateTotal() {
    this.cart.total = this.cart.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );
  }

  private touch() {
    this.updatedAt = new Date();
  }
}
