// src/modules/payments/application/providers/mpesa-reconciliation.provider.ts

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * MPESA Reconciliation Provider
 * --------------------------------
 * Purpose:
 * Pulls MPESA transaction reports from Safaricom APIs
 * or Business Portal endpoints (depending on integration level)
 *
 * Role:
 * - External truth source
 * - Used by reconciliation.service.ts
 * - Validates internal ledger vs real MPESA records
 */

export interface MpesaTransactionRecord {
  transactionId: string;
  phoneNumber: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: string;
  reference?: string;
}

@Injectable()
export class MpesaReconciliationProvider {
  private readonly logger = new Logger(MpesaReconciliationProvider.name);

  /**
   * Fetch transaction report from MPESA
   * (Typically Daraja API or reconciled CSV endpoint)
   */
  async fetchTransactions(
    fromDate: string,
    toDate: string,
  ): Promise<MpesaTransactionRecord[]> {
    try {
      // NOTE:
      // In real MPESA integration, this would use:
      // - Daraja API Transaction Status Query
      // - OR reconciliation file download endpoint
      // - OR SFTP business reports (enterprise tier)

      const response = await axios.get(
        process.env.MPESA_RECONCILIATION_URL!,
        {
          params: {
            from: fromDate,
            to: toDate,
          },
          headers: {
            Authorization: `Bearer ${process.env.MPESA_ACCESS_TOKEN}`,
          },
        },
      );

      const data = response.data;

      return data.transactions.map((tx: any) => ({
        transactionId: tx.TransID,
        phoneNumber: tx.MSISDN,
        amount: Number(tx.TransAmount),
        status: this.mapStatus(tx.TransactionStatus),
        timestamp: tx.TransTime,
        reference: tx.BillRefNumber,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch MPESA reconciliation data', error);
      throw new Error('MPESA reconciliation fetch failed');
    }
  }

  /**
   * Normalize MPESA status to internal system format
   */
  private mapStatus(status: string): MpesaTransactionRecord['status'] {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'SUCCESS';
      case 'FAILED':
      case 'REVERSED':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Health check against MPESA reconciliation endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      await axios.get(process.env.MPESA_RECONCILIATION_URL!, {
        timeout: 5000,
      });
      return true;
    } catch (error) {
      this.logger.warn('MPESA reconciliation service unreachable');
      return false;
    }
  }
}