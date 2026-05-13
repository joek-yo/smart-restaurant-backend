export interface PaymentLedgerRepository {
  findByPaymentId(paymentId: string): Promise<any>;
  save(ledger: any): Promise<any>;
  append(entry: any): Promise<any>;
}
export const PAYMENT_LEDGER_REPOSITORY = 'PAYMENT_LEDGER_REPOSITORY';
