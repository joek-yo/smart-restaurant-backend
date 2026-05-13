// FILE: src/modules/protection/infrastructure/persistence/workflow-timeline.mongo.repository.ts

import { Injectable } from '@nestjs/common';
import { WorkflowTimelineRepository } from '../../../domain/repositories/workflow-timeline.repository';
import { WorkflowTimelineEntity } from '../../../domain/entities/workflow-timeline.entity';

/**
 * MongoDB-backed durable workflow timeline storage
 * -------------------------------------------------
 * Stores full immutable workflow history for:
 * - debugging
 * - recovery
 * - anomaly detection
 * - audits
 */

@Injectable()
export class WorkflowTimelineMongoRepository implements WorkflowTimelineRepository {
  private readonly store = new Map<string, WorkflowTimelineEntity[]>(); 
  // NOTE: placeholder in-memory fallback (swap with real Mongo collection)

  async save(entity: WorkflowTimelineEntity): Promise<void> {
    const list = this.store.get(entity.traceId) ?? [];
    list.push(entity);
    this.store.set(entity.traceId, list);
  }

  async findByTraceId(traceId: string): Promise<WorkflowTimelineEntity[]> {
    return this.store.get(traceId) ?? [];
  }

  async findRecentByTenant(
    tenantId: string,
    limit: number,
  ): Promise<WorkflowTimelineEntity[]> {
    const all: WorkflowTimelineEntity[] = [];

    for (const list of this.store.values()) {
      for (const e of list) {
        if (e.tenantId === tenantId) {
          all.push(e);
        }
      }
    }

    return all
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}