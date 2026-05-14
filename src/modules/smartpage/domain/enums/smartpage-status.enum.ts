// FILE: src/modules/smartpage/domain/enums/smartpage-status.enum.ts

/**
 * SmartPageStatus
 * ------------------------------------------------------
 * Defines the lifecycle state of a SmartPage.
 *
 * IMPORTANT:
 * SmartPage status controls:
 * - rendering eligibility
 * - visibility to end users
 * - editing permissions
 * - caching behavior
 * - version publishing
 * - preview access
 * - rollback workflows
 *
 * This enum is used across:
 * - renderer
 * - orchestrator
 * - admin APIs
 * - version engine
 * - caching
 * - observability
 */

export enum SmartPageStatus {
  // ======================================================
  // PAGE IS STILL BEING BUILT / EDITED
  // ======================================================

  DRAFT = 'DRAFT',

  // ======================================================
  // PAGE IS VISIBLE TO USERS
  // ======================================================

  PUBLISHED = 'PUBLISHED',

  // ======================================================
  // PAGE EXISTS BUT TEMPORARILY HIDDEN
  // Useful for:
  // - campaigns
  // - maintenance
  // - scheduled rollout
  // ======================================================

  DISABLED = 'DISABLED',

  // ======================================================
  // PAGE NO LONGER ACTIVE
  // Historical reference only
  // ======================================================

  ARCHIVED = 'ARCHIVED',

  // ======================================================
  // PAGE IS IN PREVIEW MODE
  // Visible only to admins/editors
  // ======================================================

  PREVIEW = 'PREVIEW',

  // ======================================================
  // PAGE FAILED VALIDATION OR RENDERING
  // Prevents unsafe rendering
  // ======================================================

  ERROR = 'ERROR',

  // ======================================================
  // PAGE IS SCHEDULED BUT NOT YET LIVE
  // Useful for:
  // - flash sales
  // - campaigns
  // - timed launches
  // ======================================================

  SCHEDULED = 'SCHEDULED',
}