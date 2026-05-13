// src/modules/protection/domain/enums/protection-level.enum.ts

/**
 * ProtectionLevel
 * ----------------
 * Global severity scale for workflow protection incidents.
 *
 * Used across:
 * - anomaly detection
 * - recovery engine
 * - workflow repair
 * - observability alerts
 */
export enum ProtectionLevel {
  /**
   * INFO
   * ----
   * Non-critical event.
   * System is healthy but recording behavior.
   *
   * Example:
   * - minor retry
   * - harmless duplicate detection
   */
  INFO = 'INFO',

  /**
   * WARNING
   * -------
   * Potential issue detected.
   * No failure yet, but risk exists.
   *
   * Example:
   * - delayed response
   * - repeated message patterns
   */
  WARNING = 'WARNING',

  /**
   * CRITICAL
   * --------
   * Workflow integrity is at risk.
   * Requires recovery or repair action.
   *
   * Example:
   * - state mismatch
   * - checkout/payment desync
   */
  CRITICAL = 'CRITICAL',

  /**
   * FATAL
   * -----
   * System-level or workflow-breaking failure.
   * Recovery may require full rebuild or reset.
   *
   * Example:
   * - corrupted workflow state
   * - tenant isolation breach
   */
  FATAL = 'FATAL',
}