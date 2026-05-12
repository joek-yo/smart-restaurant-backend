// src/modules/payments/application/services/reconciliation.service.ts

/**
 * ReconciliationService
 * ----------------------------------------------------
 * PURPOSE:
 * Final source-of-truth correction layer between:
 * - internal payment state
 * - payment ledger
 * - MPESA provider state
 *
 * RESPONSIBILITIES:
 * - detect payment inconsistencies
 * - repair stale/incorrect payment states
 * - recover from lost callbacks
 * - resolve timeout uncertainty
 * - maintain financial correctness
 *
 * RUN MODES:
 * - cron/scheduled reconciliation
 * - manual admin trigger
 * - retry recovery workflows
 */

import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentLedgerRepository } from '../repositories/payment-ledger.repository';
import { MpesaProvider } from '../providers/mpesa.provider';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(
    ReconciliationService.name,
  );

  /**
   * Payments older than this become "stale"
   * and qualify for reconciliation.
   */
  private readonly STALE_PAYMENT_THRESHOLD_MS =
    Number(
      process.env.PAYMENT_RECONCILIATION_STALE_MS,
    ) ||
    5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly ledgerRepo: PaymentLedgerRepository,
    private readonly mpesaProvider: MpesaProvider,
  ) {}

  // =====================================================
  // 🔄 MAIN BATCH RECONCILIATION
  // =====================================================

  /**
   * Reconcile payments within a date range
   */
  async reconcilePayments(
    fromDate: Date,
    toDate: Date,
  ): Promise<void> {
    this.logger.log(
      `[RECONCILIATION_STARTED] from=${fromDate.toISOString()} to=${toDate.toISOString()}`,
    );

    const payments =
      await this.paymentRepo.findByDateRange(
        fromDate,
        toDate,
      );

    let repaired = 0;
    let checked = 0;
    let failed = 0;

    for (const payment of payments) {
      try {
        checked++;

        const wasRepaired =
          await this.reconcileSinglePayment(
            payment.id,
          );

        if (wasRepaired) {
          repaired++;
        }
      } catch (error: any) {
        failed++;

        this.logger.error(
          `[RECONCILIATION_ERROR] paymentId=${payment.id} error=${error?.message}`,
        );
      }
    }

    this.logger.log(
      `[RECONCILIATION_COMPLETED] checked=${checked} repaired=${repaired} failed=${failed}`,
    );
  }

  // =====================================================
  // 🔥 RECONCILE STALE PAYMENTS
  // =====================================================

  /**
   * Used by cron/retry workers
   */
  async reconcileStalePayments(): Promise<void> {
    const staleBefore = new Date(
      Date.now() -
        this.STALE_PAYMENT_THRESHOLD_MS,
    );

    this.logger.log(
      `[RECONCILIATION_STALE_SCAN] before=${staleBefore.toISOString()}`,
    );

    /**
     * IMPORTANT:
     * Repository should return payments like:
     * - PENDING
     * - PROCESSING
     * - UNKNOWN
     * - RETRYING
     */
    const stalePayments =
      await this.paymentRepo.findStalePayments(
        staleBefore,
      );

    for (const payment of stalePayments) {
      try {
        await this.reconcileSinglePayment(
          payment.id,
        );
      } catch (error: any) {
        this.logger.error(
          `[STALE_RECONCILIATION_FAILED] paymentId=${payment.id} error=${error?.message}`,
        );
      }
    }

    this.logger.log(
      `[STALE_RECONCILIATION_COMPLETED] total=${stalePayments.length}`,
    );
  }

  // =====================================================
  // 🔍 SINGLE PAYMENT RECONCILIATION
  // =====================================================

  /**
   * Returns TRUE if payment was repaired
   */
  async reconcileSinglePayment(
    paymentId: string,
  ): Promise<boolean> {
    const payment =
      await this.paymentRepo.findById(paymentId);

    if (!payment) {
      this.logger.warn(
        `[RECONCILIATION_PAYMENT_NOT_FOUND] paymentId=${paymentId}`,
      );

      return false;
    }

    /**
     * Prevent unnecessary provider calls
     */
    if (
      payment.status?.isConfirmed?.() ||
      payment.status?.isFailed?.() ||
      payment.status?.isRefunded?.()
    ) {
      this.logger.debug(
        `[RECONCILIATION_SKIPPED_FINAL_STATE] paymentId=${payment.id}`,
      );

      return false;
    }

    const providerReference =
      payment.providerRef ||
      payment.externalReference;

    if (!providerReference) {
      this.logger.warn(
        `[RECONCILIATION_NO_PROVIDER_REF] paymentId=${payment.id}`,
      );

      return false;
    }

    this.logger.log(
      `[RECONCILIATION_VERIFYING] paymentId=${payment.id} providerRef=${providerReference}`,
    );

    // =====================================================
    // 📡 QUERY MPESA
    // =====================================================

    const mpesaRecord =
      await this.mpesaProvider.queryTransaction(
        providerReference,
      );

    if (!mpesaRecord) {
      this.logger.warn(
        `[RECONCILIATION_NO_PROVIDER_RECORD] paymentId=${payment.id}`,
      );

      return false;
    }

    const systemStatus =
      payment.status.getValue();

    const providerStatus =
      mpesaRecord.status;

    // =====================================================
    // ✅ NO MISMATCH
    // =====================================================

    if (
      !this.isMismatch(
        systemStatus,
        providerStatus,
      )
    ) {
      this.logger.debug(
        `[RECONCILIATION_MATCH] paymentId=${payment.id} status=${systemStatus}`,
      );

      return false;
    }

    // =====================================================
    // ⚠️ MISMATCH DETECTED
    // =====================================================

    this.logger.warn(
      `[RECONCILIATION_MISMATCH] paymentId=${payment.id} system=${systemStatus} provider=${providerStatus}`,
    );

    await this.resolveMismatch(
      payment,
      mpesaRecord,
    );

    return true;
  }

  // =====================================================
  // ⚖️ MISMATCH DETECTION
  // =====================================================

  private isMismatch(
    systemStatus: string,
    providerStatus: string,
  ): boolean {
    return (
      this.normalizeStatus(systemStatus) !==
      this.normalizeStatus(providerStatus)
    );
  }

  // =====================================================
  // 🔧 REPAIR PAYMENT STATE
  // =====================================================

  private async resolveMismatch(
    payment: any,
    mpesaRecord: any,
  ): Promise<void> {
    const providerStatus =
      this.normalizeStatus(
        mpesaRecord.status,
      );

    // =====================================================
    // ✅ PROVIDER SAYS SUCCESS
    // =====================================================

    if (providerStatus === 'SUCCESS') {
      await this.repairAsSuccess(
        payment,
        mpesaRecord,
      );

      return;
    }

    // =====================================================
    // ❌ PROVIDER SAYS FAILED
    // =====================================================

    if (providerStatus === 'FAILED') {
      await this.repairAsFailed(
        payment,
        mpesaRecord,
      );

      return;
    }

    // =====================================================
    // ⏳ STILL PENDING
    // =====================================================

    this.logger.log(
      `[RECONCILIATION_PENDING_PROVIDER] paymentId=${payment.id}`,
    );
  }

  // =====================================================
  // ✅ REPAIR SUCCESS
  // =====================================================

  private async repairAsSuccess(
    payment: any,
    mpesaRecord: any,
  ): Promise<void> {
    payment.markAsConfirmed?.();

    await this.paymentRepo.save(payment);

    await this.ledgerRepo.append({
      paymentId: payment.id,
      type: 'RECONCILED_SUCCESS',
      amount: payment.amount,
      metadata: {
        reason:
          'provider_override_success',
        provider: 'mpesa',
        providerReceipt:
          mpesaRecord.receipt,
        providerReference:
          mpesaRecord.providerReference,
      },
    });

    this.logger.log(
      `[RECONCILIATION_REPAIRED_SUCCESS] paymentId=${payment.id}`,
    );
  }

  // =====================================================
  // ❌ REPAIR FAILURE
  // =====================================================

  private async repairAsFailed(
    payment: any,
    mpesaRecord: any,
  ): Promise<void> {
    payment.markAsFailed?.();

    await this.paymentRepo.save(payment);

    await this.ledgerRepo.append({
      paymentId: payment.id,
      type: 'RECONCILED_FAILED',
      amount: payment.amount,
      metadata: {
        reason:
          'provider_override_failed',
        provider: 'mpesa',
      },
    });

    this.logger.log(
      `[RECONCILIATION_REPAIRED_FAILED] paymentId=${payment.id}`,
    );
  }

  // =====================================================
  // 🔄 STATUS NORMALIZATION
  // =====================================================

  /**
   * Maps provider/system statuses
   * into comparable values.
   */
  private normalizeStatus(
    status?: string,
  ): string {
    if (!status) {
      return 'UNKNOWN';
    }

    const normalized =
      status.toUpperCase();

    if (
      [
        'SUCCESS',
        'CONFIRMED',
        'COMPLETED',
        'PAID',
      ].includes(normalized)
    ) {
      return 'SUCCESS';
    }

    if (
      [
        'FAILED',
        'CANCELLED',
        'ERROR',
      ].includes(normalized)
    ) {
      return 'FAILED';
    }

    if (
      [
        'PENDING',
        'PROCESSING',
        'INITIATED',
        'RETRYING',
      ].includes(normalized)
    ) {
      return 'PENDING';
    }

    return normalized;
  }
}