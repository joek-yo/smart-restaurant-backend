// FILE: src/modules/smartpage/domain/entities/smartpage-version.entity.ts

/**
 * SmartPageVersionEntity
 * ---------------------------------------------------
 * VERSIONING CORE FOR SMARTPAGE ENGINE
 *
 * Supports:
 * - rollback
 * - A/B testing
 * - draft vs published separation
 * - preview rendering
 *
 * IMPORTANT:
 * This entity does NOT represent the page itself.
 * It represents a SNAPSHOT of a SmartPage at a point in time.
 */

import { BaseEntity } from '@common/base.entity';

export type SmartPageVersionStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'ROLLED_BACK';

export interface SmartPageVersionMetadata {
  createdBy?: string;

  updatedBy?: string;

  changeLog?: string;

  experimentId?: string;

  variant?: 'A' | 'B' | 'CONTROL';

  isPreview?: boolean;

  isAIGenerated?: boolean;
}

export interface SmartPageVersionSnapshot {
  pageId: string;

  tenantId: string;

  blocks: any[]; // raw snapshot of SmartPageBlockEntity

  routing?: {
    path?: string;
    slug?: string;
  };

  metadata?: Record<string, any>;
}

export interface SmartPageVersionProps {
  id: string;

  pageId: string;

  tenantId: string;

  versionNumber: number;

  status: SmartPageVersionStatus;

  snapshot: SmartPageVersionSnapshot;

  metadata: SmartPageVersionMetadata;

  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * SmartPageVersionEntity
 * ---------------------------------------------------
 * IMMUTABLE VERSION SNAPSHOT
 */
export class SmartPageVersionEntity extends BaseEntity {
  public readonly id: string;

  public readonly pageId: string;

  public readonly tenantId: string;

  public readonly versionNumber: number;

  public status: SmartPageVersionStatus;

  public readonly snapshot: SmartPageVersionSnapshot;

  public metadata: SmartPageVersionMetadata;

  constructor(props: SmartPageVersionProps) {
    super(props as any);

    this.id = props.id;
    this.pageId = props.pageId;
    this.tenantId = props.tenantId;

    this.versionNumber = props.versionNumber;

    this.status = props.status;

    this.snapshot = Object.freeze({
      ...props.snapshot,
      blocks: Object.freeze(props.snapshot.blocks ?? []),
    });

    this.metadata = Object.freeze({ ...props.metadata });
  }

  // ==================================================
  // 🔄 VERSION STATE MANAGEMENT
  // ==================================================

  publish(): void {
    this.status = 'PUBLISHED';
    this.touch();
  }

  archive(): void {
    this.status = 'ARCHIVED';
    this.touch();
  }

  rollback(): void {
    this.status = 'ROLLED_BACK';
    this.touch();
  }

  markDraft(): void {
    this.status = 'DRAFT';
    this.touch();
  }

  // ==================================================
  // 🧠 VERSION TYPE HELPERS
  // ==================================================

  isPublished(): boolean {
    return this.status === 'PUBLISHED';
  }

  isDraft(): boolean {
    return this.status === 'DRAFT';
  }

  isArchived(): boolean {
    return this.status === 'ARCHIVED';
  }

  isRolledBack(): boolean {
    return this.status === 'ROLLED_BACK';
  }

  // ==================================================
  // 🧪 EXPERIMENTATION SUPPORT
  // ==================================================

  isExperiment(): boolean {
    return !!this.metadata?.experimentId;
  }

  isABTest(): boolean {
    return this.metadata?.variant === 'A' || this.metadata?.variant === 'B';
  }

  isPreview(): boolean {
    return !!this.metadata?.isPreview;
  }

  isAIGenerated(): boolean {
    return !!this.metadata?.isAIGenerated;
  }

  // ==================================================
  // 📦 SNAPSHOT ACCESS
  // ==================================================

  getBlocks(): any[] {
    return this.snapshot.blocks;
  }

  getPageId(): string {
    return this.pageId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getVersion(): number {
    return this.versionNumber;
  }
}