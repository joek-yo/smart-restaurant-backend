// FILE: src/modules/smartpage/domain/repositories/smartpage.repository.ts

/**
 * SmartPageRepository
 * ---------------------------------------------------
 * DOMAIN REPOSITORY CONTRACT (PORT)
 *
 * This defines ALL persistence operations for SmartPages.
 *
 * IMPORTANT RULES:
 * - No implementation here (PURE CONTRACT)
 * - No database logic
 * - No framework dependency
 *
 * Implementations live in:
 * - infrastructure/persistence/*
 *
 * This is the boundary between:
 * DOMAIN  ↔  INFRASTRUCTURE
 */

import { SmartPageEntity } from '../entities/smartpage.entity';
import { SmartPageVersionEntity } from '../entities/smartpage-version.entity';
import { SmartPageRuntimeEntity } from '../entities/smartpage-runtime.entity';
import { SmartPageStatus } from '../enums/smartpage-status.enum';

export interface SmartPageQueryOptions {
  tenantId: string;

  status?: SmartPageStatus;

  pageId?: string;

  slug?: string;

  includeBlocks?: boolean;

  version?: number;
}

export interface SmartPageRepository {
  // ==================================================
  // 📦 CORE PAGE OPERATIONS
  // ==================================================

  findById(id: string): Promise<SmartPageEntity | null>;

  findBySlug(
    tenantId: string,
    slug: string,
  ): Promise<SmartPageEntity | null>;

  findMany(options: SmartPageQueryOptions): Promise<SmartPageEntity[]>;

  save(page: SmartPageEntity): Promise<SmartPageEntity>;

  update(page: SmartPageEntity): Promise<SmartPageEntity>;

  delete(pageId: string): Promise<void>;

  // ==================================================
  // 🔄 VERSIONING OPERATIONS
  // ==================================================

  createVersion(
    version: SmartPageVersionEntity,
  ): Promise<SmartPageVersionEntity>;

  getVersions(pageId: string): Promise<SmartPageVersionEntity[]>;

  getVersionByNumber(
    pageId: string,
    version: number,
  ): Promise<SmartPageVersionEntity | null>;

  rollbackToVersion(
    pageId: string,
    version: number,
  ): Promise<SmartPageEntity>;

  // ==================================================
  // 🚀 RUNTIME OPERATIONS (OBSERVABILITY)
  // ==================================================

  saveRuntime(
    runtime: SmartPageRuntimeEntity,
  ): Promise<SmartPageRuntimeEntity>;

  getRuntimeById(
    runtimeId: string,
  ): Promise<SmartPageRuntimeEntity | null>;

  getRuntimeByPage(
    pageId: string,
    limit?: number,
  ): Promise<SmartPageRuntimeEntity[]>;

  // ==================================================
  // 🧠 LIFECYCLE HELPERS
  // ==================================================

  publish(pageId: string): Promise<SmartPageEntity>;

  archive(pageId: string): Promise<SmartPageEntity>;

  disable(pageId: string): Promise<SmartPageEntity>;

  setDraft(pageId: string): Promise<SmartPageEntity>;
}
export const SMARTPAGE_REPOSITORY = 'SMARTPAGE_REPOSITORY';
