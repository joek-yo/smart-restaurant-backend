export interface PaymentRepository {
  findById(id: string): Promise<any>;
  save(payment: any): Promise<any>;
  findByOrderId(orderId: string): Promise<any>;
  findStale(thresholdMs: number): Promise<any[]>;
  findByDateRange(from: Date, to: Date): Promise<any[]>;
  findStalePayments(thresholdMs: number): Promise<any[]>;
}
export const PAYMENT_REPOSITORY = 'PAYMENT_REPOSITORY';
