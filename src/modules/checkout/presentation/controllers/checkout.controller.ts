import { Body, Controller, Post, Delete, Patch, Req } from '@nestjs/common';
import { CheckoutOrchestratorService } from '../../application/orchestrators/checkout-orchestrator.service';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { RemoveCartItemDto } from '../dto/remove-cart-item.dto';
import { UpdateCartQuantityDto } from '../dto/update-cart-quantity.dto';
import { StartCheckoutDto } from '../dto/start-checkout.dto';
import { ConfirmCheckoutDto } from '../dto/confirm-checkout.dto';
import { CancelCheckoutDto } from '../dto/cancel-checkout.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly orchestrator: CheckoutOrchestratorService) {}

  @Post('cart/add')
  async addItem(@Body() dto: AddCartItemDto, @Req() req: any) {
    return this.orchestrator.addToCart(
      { userId: req.user?.id ?? dto.userId, tenantId: req.tenantId ?? dto.tenantId, branchId: dto.branchId, channel: 'api' },
      { productId: dto.productId, name: dto.name, price: dto.price, quantity: dto.quantity },
    );
  }

  @Patch('cart/update')
  async updateQuantity(@Body() dto: UpdateCartQuantityDto, @Req() req: any) {
    return this.orchestrator.updateCartQuantity(
      { userId: req.user?.id ?? dto.userId, tenantId: req.tenantId ?? dto.tenantId, branchId: dto.branchId, channel: 'api' },
      dto.productId,
      dto.quantity,
    );
  }

  @Delete('cart/remove')
  async removeItem(@Body() dto: RemoveCartItemDto, @Req() req: any) {
    return this.orchestrator.removeFromCart(
      { userId: req.user?.id ?? dto.userId, tenantId: req.tenantId ?? dto.tenantId, branchId: dto.branchId, channel: 'api' },
      dto.productId,
    );
  }

  @Post('start')
  async startCheckout(@Body() dto: StartCheckoutDto, @Req() req: any) {
    return this.orchestrator.startCheckout(
      { userId: req.user?.id ?? dto.userId, tenantId: req.tenantId ?? dto.tenantId, branchId: dto.branchId, channel: dto.channel ?? 'api' },
    );
  }

  @Post('confirm')
  async confirmCheckout(@Body() dto: ConfirmCheckoutDto, @Req() req: any) {
    return this.orchestrator.confirmCheckout(
      { userId: req.user?.id ?? dto.userId, tenantId: req.tenantId ?? dto.tenantId, branchId: dto.branchId, channel: 'api' },
    );
  }

  @Post('cancel')
  async cancelCheckout(@Body() dto: CancelCheckoutDto, @Req() req: any) {
    return this.orchestrator.cancelCheckout(
      { userId: req.user?.id ?? dto.userId, tenantId: req.tenantId ?? dto.tenantId, branchId: dto.branchId, channel: 'api' },
    );
  }
}
