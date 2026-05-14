// FILE: src/modules/smartpage/domain/entities/smartpage.entity.ts

/**
 * SmartPageEntity (AGGREGATE ROOT)
 * ---------------------------------------------------
 * THIS IS THE CORE AGGREGATE OF THE SMARTPAGE ENGINE
 *
 * It represents an entire renderable page composed of:
 * - blocks (HERO, PRODUCT, CART, etc.)
 * - versioning system
 * - lifecycle status
 * - routing + targeting rules
 * - metadata + experiments
 *
 * IMPORTANT:
 * - This is the SINGLE SOURCE OF TRUTH for a SmartPage
 * - All rendering flows ultimately resolve from here
 * - Mutation should be controlled through domain methods only
 */

import { BaseEntity } from '@common/base.entity';
import { SmartPageBlockEntity } from './smartpage-block.entity';
import { SmartPageStatus } from '../enums/smartpage-status.enum';

export interface SmartPageRouting {
  path?: string;              // e.g. "/home", "/menu", "/checkout"
  slug?: string;              // e.g. "home-page"
  domain?: string;            // optional custom domain mapping
  isDefault?: boolean;
}

export interface SmartPageMetadata {
  name: string;
  description?: string;

  isAIGenerated?: boolean;
  isPersonalized?: boolean;

  experimentId?: string;

  createdBy?: string;
  updatedBy?: string;

  tags?: string[];

  locale?: string;
}

export interface SmartPageProps {
  id: string;

  tenantId: string;

  blocks: SmartPageBlockEntity[];

  version: number;

  status: SmartPageStatus;

  routing: SmartPageRouting;

  metadata: SmartPageMetadata;
}

/**
 * SmartPageEntity
 * ---------------------------------------------------
 * AGGREGATE ROOT
 *
 * Controls:
 * - page composition
 * - lifecycle
 * - versioning
 * - routing
 */
export class SmartPageEntity extends BaseEntity {
  public readonly id: string;

  public readonly tenantId: string;

  private _blocks: SmartPageBlockEntity[];

  public version: number;

  public status: SmartPageStatus;

  public routing: SmartPageRouting;

  public metadata: SmartPageMetadata;

  constructor(props: SmartPageProps) {
    super(props as any);

    this.id = props.id;
    this.tenantId = props.tenantId;

    this._blocks = props.blocks ?? [];

    this.version = props.version ?? 1;

    this.status = props.status;

    this.routing = Object.freeze({ ...props.routing });

    this.metadata = Object.freeze({ ...props.metadata });
  }

  // ==================================================
  // 📦 BLOCK MANAGEMENT (DOMAIN CONTROL)
  // ==================================================

  get blocks(): SmartPageBlockEntity[] {
    return this._blocks;
  }

  addBlock(block: SmartPageBlockEntity): void {
    this._blocks.push(block);
    this.touch();
  }

  removeBlock(blockId: string): void {
    this._blocks = this._blocks.filter(b => b.id !== blockId);
    this.touch();
  }

  updateBlock(updated: SmartPageBlockEntity): void {
    const index = this._blocks.findIndex(b => b.id === updated.id);

    if (index === -1) {
      throw new Error(`Block not found: ${updated.id}`);
    }

    this._blocks[index] = updated;
    this.touch();
  }

  reorderBlocks(blockIds: string[]): void {
    const map = new Map(this._blocks.map(b => [b.id, b]));

    this._blocks = blockIds
      .map(id => map.get(id))
      .filter(Boolean) as SmartPageBlockEntity[];

    this.touch();
  }

  // ==================================================
  // 🔄 LIFECYCLE MANAGEMENT
  // ==================================================

  publish(): void {
    this.status = SmartPageStatus.PUBLISHED;
    this.incrementVersion();
  }

  draft(): void {
    this.status = SmartPageStatus.DRAFT;
    this.touch();
  }

  archive(): void {
    this.status = SmartPageStatus.ARCHIVED;
    this.touch();
  }

  disable(): void {
    this.status = SmartPageStatus.DISABLED;
    this.touch();
  }

  // ==================================================
  // 🧠 VERSIONING
  // ==================================================

  incrementVersion(): void {
    this.version += 1;
    this.touch();
  }

  // ==================================================
  // 🔍 DERIVED HELPERS
  // ==================================================

  isPublished(): boolean {
    return this.status === SmartPageStatus.PUBLISHED;
  }

  isDraft(): boolean {
    return this.status === SmartPageStatus.DRAFT;
  }

  hasBlocks(): boolean {
    return this._blocks.length > 0;
  }

  getBlockCount(): number {
    return this._blocks.length;
  }

  getVisibleBlocks(): SmartPageBlockEntity[] {
    return this._blocks.filter(b => b.enabled);
  }

  // ==================================================
  // 🧾 SNAPSHOT (FOR RENDER PIPELINE)
  // ==================================================

  snapshot(): SmartPageEntity {
    return new SmartPageEntity({
      id: this.id,
      tenantId: this.tenantId,
      blocks: this._blocks,
      version: this.version,
      status: this.status,
      routing: this.routing,
      metadata: this.metadata,
    });
  }
}