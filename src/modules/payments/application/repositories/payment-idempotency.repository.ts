export interface PaymentIdempotencyRepository {
  findByKey(key: string): Promise<any>;
  findByKeyAndContext(key: string, context: string): Promise<any>;
  save(key: string, result: any): Promise<void>;
}
export const PAYMENT_IDEMPOTENCY_REPOSITORY = 'PAYMENT_IDEMPOTENCY_REPOSITORY';
