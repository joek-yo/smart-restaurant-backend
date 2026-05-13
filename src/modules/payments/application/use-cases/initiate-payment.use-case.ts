import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PaymentOrchestratorService } from '../orchestrators/payment-orchestrator.service';
import { MoneyVO } from '../../domain/value-objects/money.vo';
import { PaymentStatus, PaymentStatusVO } from '../../domain/value-objects/payment-status.vo';

interface OrderRepository {
  findById(orderId: string): Promise<any>;
}

@Injectable()
export class InitiatePaymentUseCase {
  private readonly logger = new Logger(InitiatePaymentUseCase.name);

  constructor(
    private readonly orchestrator: PaymentOrchestratorService,
    private readonly orderRepo: OrderRepository,
  ) {}

  async execute(input: {
    tenantId: string;
    userId: string;
    orderId: string;
    amount: number;
    currency: string;
    sessionId?: string;
    channel: string;
    idempotencyKey?: string;
  }) {
    this.logger.log(`[InitiatePayment] order=${input.orderId}`);

    const order = await this.orderRepo.findById(input.orderId);
    if (!order) throw new BadRequestException('Order not found');
    if (order.tenantId !== input.tenantId) throw new BadRequestException('Tenant mismatch');

    const amount = new MoneyVO(input.amount, input.currency);
    if (amount.amount <= 0) throw new BadRequestException('Invalid payment amount');

    const result = await this.orchestrator.initiatePayment(
      {
        tenantId: input.tenantId,
        userId: input.userId,
        orderId: input.orderId,
        sessionId: input.sessionId,
        channel: input.channel,
        idempotencyKey: input.idempotencyKey,
      },
      amount,
    );

    return {
      success: true,
      paymentId: result.paymentId,
      provider: result.provider,
      providerReference: result.providerReference,
      status: result.status ?? new PaymentStatusVO(PaymentStatus.INITIATED),
    };
  }
}
