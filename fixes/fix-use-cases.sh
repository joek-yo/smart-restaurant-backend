#!/bin/bash
# fix-use-cases.sh — patches all getOrCreate callers with tenantId
# Run from ~/backend-clean

set -e

echo "✍️  Patching all use-cases..."

# ─────────────────────────────────────────────────────────────
# 1. cancel-checkout.use-case.ts
# ─────────────────────────────────────────────────────────────
cat > src/modules/checkout/application/use-cases/cancel-checkout.use-case.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';

@Injectable()
export class CancelCheckoutUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(input: { userId: string; tenantId: string; branchId?: string }) {
    const session = await this.sessionService.getOrCreate(input.userId, input.tenantId, input.branchId);
    session.reset();
    await this.sessionService.save(session);
    return { cancelled: true, sessionId: session.id };
  }
}
EOF

# ─────────────────────────────────────────────────────────────
# 2. validate-checkout.use-case.ts
# ─────────────────────────────────────────────────────────────
cat > src/modules/checkout/application/use-cases/validate-checkout.use-case.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { CheckoutValidationService } from '../services/checkout-validation.service';
import { SessionService } from '@modules/sessions/application/services/session.service';

@Injectable()
export class ValidateCheckoutUseCase {
  constructor(
    private readonly sessionService: SessionService,
    private readonly validation: CheckoutValidationService,
  ) {}

  async execute(input: { userId: string; tenantId: string; branchId?: string }) {
    const session = await this.sessionService.getOrCreate(input.userId, input.tenantId, input.branchId);
    this.validation.validateSession(session, input.tenantId);
    return { valid: true, sessionId: session.id };
  }
}
EOF

# ─────────────────────────────────────────────────────────────
# 3. add-item-to-cart.use-case.ts
# ─────────────────────────────────────────────────────────────
cat > src/modules/checkout/application/use-cases/add-item-to-cart.use-case.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';
import { CartItemEntity } from '@modules/sessions/domain/entities/cart-item.entity';

@Injectable()
export class AddItemToCartUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(input: {
    userId: string;
    tenantId: string;
    branchId?: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }) {
    const session = await this.sessionService.getOrCreate(input.userId, input.tenantId, input.branchId);

    const item = new CartItemEntity({
      productId: input.productId,
      name: input.name,
      price: input.price,
      quantity: input.quantity,
      sessionId: session.id!,
      businessId: session.businessId,
    });

    session.addItem(item);
    await this.sessionService.save(session);
    return session;
  }
}
EOF

# ─────────────────────────────────────────────────────────────
# 4. confirm-checkout.use-case.ts
# ─────────────────────────────────────────────────────────────
cat > src/modules/checkout/application/use-cases/confirm-checkout.use-case.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';
import { CreateOrderFromCheckoutUseCase } from './create-order-from-checkout.use-case';

@Injectable()
export class ConfirmCheckoutUseCase {
  constructor(
    private readonly sessionService: SessionService,
    private readonly createOrder: CreateOrderFromCheckoutUseCase,
  ) {}

  async execute(input: { userId: string; tenantId: string; branchId?: string }) {
    const session = await this.sessionService.getOrCreate(input.userId, input.tenantId, input.branchId);

    if (!session.items || session.items.length === 0) {
      throw new Error('Cannot confirm checkout with empty cart');
    }

    session.checkout();
    await this.sessionService.save(session);

    const order = await this.createOrder.execute(session);

    return {
      success: true,
      orderId: order.id,
      total: order.totalAmount,
    };
  }
}
EOF

# ─────────────────────────────────────────────────────────────
# 5. start-checkout.use-case.ts
# ─────────────────────────────────────────────────────────────
cat > src/modules/checkout/application/use-cases/start-checkout.use-case.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';

@Injectable()
export class StartCheckoutUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(input: { userId: string; tenantId: string; branchId?: string }) {
    const session = await this.sessionService.getOrCreate(input.userId, input.tenantId, input.branchId);

    if (!session.items || session.items.length === 0) {
      throw new Error('Cannot start checkout with empty cart');
    }

    session.checkout();
    await this.sessionService.save(session);

    return { sessionId: session.id, state: session.state };
  }
}
EOF

# ─────────────────────────────────────────────────────────────
# 6. update-cart-quantity.use-case.ts
# ─────────────────────────────────────────────────────────────
cat > src/modules/checkout/application/use-cases/update-cart-quantity.use-case.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';

@Injectable()
export class UpdateCartQuantityUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(input: {
    userId: string;
    tenantId: string;
    branchId?: string;
    productId: string;
    quantity: number;
  }) {
    const session = await this.sessionService.getOrCreate(input.userId, input.tenantId, input.branchId);
    session.updateQuantity(input.productId, input.quantity);
    await this.sessionService.save(session);
    return session;
  }
}
EOF

# ─────────────────────────────────────────────────────────────
# 7. remove-item-from-cart.use-case.ts
# ─────────────────────────────────────────────────────────────
cat > src/modules/checkout/application/use-cases/remove-item-from-cart.use-case.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';

@Injectable()
export class RemoveItemFromCartUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(input: { userId: string; tenantId: string; branchId?: string; productId: string }) {
    const session = await this.sessionService.getOrCreate(input.userId, input.tenantId, input.branchId);
    session.removeItem(input.productId);
    await this.sessionService.save(session);
    return session;
  }
}
EOF

# ─────────────────────────────────────────────────────────────
# 8. clear-cart.use-case.ts
# ─────────────────────────────────────────────────────────────
cat > src/modules/checkout/application/use-cases/clear-cart.use-case.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';

@Injectable()
export class ClearCartUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(input: { userId: string; tenantId: string; branchId?: string }) {
    const session = await this.sessionService.getOrCreate(input.userId, input.tenantId, input.branchId);
    session.reset();
    await this.sessionService.save(session);
    return session;
  }
}
EOF

# ─────────────────────────────────────────────────────────────
# 9. generate-checkout-summary.use-case.ts
# ─────────────────────────────────────────────────────────────
cat > src/modules/checkout/application/use-cases/generate-checkout-summary.use-case.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { CheckoutSummaryService } from '../services/checkout-summary.service';
import { SessionService } from '@modules/sessions/application/services/session.service';

@Injectable()
export class GenerateCheckoutSummaryUseCase {
  constructor(
    private readonly sessionService: SessionService,
    private readonly summaryService: CheckoutSummaryService,
  ) {}

  async execute(input: { userId: string; tenantId: string; branchId?: string }) {
    const session = await this.sessionService.getOrCreate(input.userId, input.tenantId, input.branchId);
    const summary = this.summaryService.build(session.items);
    return { sessionId: session.id, summary, state: session.state };
  }
}
EOF

# ─────────────────────────────────────────────────────────────
# 10. sessions/add-to-cart.use-case.ts  (legacy — kept for WhatsApp gateway compat)
# ─────────────────────────────────────────────────────────────
cat > src/modules/sessions/application/use-cases/add-to-cart.use-case.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { CartItemEntity } from '../../domain/entities/cart-item.entity';

@Injectable()
export class AddToCartUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(userId: string, item: CartItemEntity, tenantId: string, branchId?: string): Promise<void> {
    const session = await this.sessionService.getOrCreate(userId, tenantId, branchId);
    session.addItem(item);
    await this.sessionService.update(session.id!, {
      items: session.items,
      state: session.state,
    });
  }
}
EOF

# ─────────────────────────────────────────────────────────────
# 11. sessions/remove-from-cart.use-case.ts
# ─────────────────────────────────────────────────────────────
cat > src/modules/sessions/application/use-cases/remove-from-cart.use-case.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { SessionService } from '../services/session.service';

@Injectable()
export class RemoveFromCartUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(userId: string, productId: string, tenantId: string, branchId?: string): Promise<void> {
    const session = await this.sessionService.getOrCreate(userId, tenantId, branchId);
    session.removeItem(productId);
    await this.sessionService.save(session);
  }
}
EOF

echo ""
echo "✅ All 11 use-cases patched!"
echo "Next: npm run start:dev"