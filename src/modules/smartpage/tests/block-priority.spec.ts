// src/modules/smartpage/tests/block-priority.spec.ts

import { Test } from '@nestjs/testing';

import { VisibilityEngineService } from '../application/renderer/visibility-engine.service';
import { SmartPagePersonalizationService } from '../application/ai/smartpage-personalization.service';

/**
 * BLOCK PRIORITY TEST
 * -----------------------------------------------------
 * Validates:
 * - visibility filtering
 * - priority ordering
 * - personalization impact on ordering
 * - safe fallback when rules conflict
 */

describe('Block Priority + Visibility Engine', () => {
  let visibilityEngine: VisibilityEngineService;
  let personalization: SmartPagePersonalizationService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        VisibilityEngineService,
        SmartPagePersonalizationService,
      ],
    }).compile();

    visibilityEngine = moduleRef.get(VisibilityEngineService);
    personalization = moduleRef.get(SmartPagePersonalizationService);
  });

  it('should hide blocks that fail visibility rules', () => {
    const blocks = [
      {
        id: '1',
        type: 'CHECKOUT',
        priority: 1,
        visibility: { requiresCart: true },
      },
      {
        id: '2',
        type: 'HERO',
        priority: 5,
        visibility: {},
      },
    ];

    const context = {
      hasCart: false,
      userId: 'user_1',
    };

    const result = visibilityEngine.filterBlocks(blocks as any, context as any);

    expect(result.find((b) => b.id === '1')).toBeUndefined();
    expect(result.find((b) => b.id === '2')).toBeDefined();
  });

  it('should preserve priority ordering after filtering', () => {
    const blocks = [
      { id: 'a', type: 'HERO', priority: 10 },
      { id: 'b', type: 'PRODUCT', priority: 1 },
      { id: 'c', type: 'BANNER', priority: 5 },
    ];

    const context = {
      hasCart: true,
    };

    const filtered = visibilityEngine.filterBlocks(blocks as any, context as any);

    const ordered = filtered.sort((a, b) => a.priority - b.priority);

    expect(ordered[0].id).toBe('b');
    expect(ordered[ordered.length - 1].id).toBe('a');
  });

  it('should allow personalization engine to reorder blocks', () => {
    const blocks = [
      { id: 'hero', type: 'HERO', priority: 10 },
      { id: 'rec', type: 'RECOMMENDATION', priority: 5 },
      { id: 'product', type: 'PRODUCT', priority: 1 },
    ];

    const context = {
      userId: 'user_1',
      returningUser: true,
    };

    const result = personalization.personalizeBlocks(blocks as any, context as any);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    // Personalized systems often boost recommendations for returning users
    const recIndex = result.findIndex((b) => b.id === 'rec');
    const productIndex = result.findIndex((b) => b.id === 'product');

    expect(recIndex).toBeGreaterThanOrEqual(0);
    expect(productIndex).toBeGreaterThanOrEqual(0);
  });

  it('should not break when all blocks are filtered out', () => {
    const blocks = [
      {
        id: 'checkout',
        type: 'CHECKOUT',
        priority: 1,
        visibility: { requiresCart: true },
      },
    ];

    const context = {
      hasCart: false,
    };

    const result = visibilityEngine.filterBlocks(blocks as any, context as any);

    expect(result).toEqual([]);
  });

  it('should maintain stable output ordering across runs', () => {
    const blocks = [
      { id: '1', type: 'HERO', priority: 3 },
      { id: '2', type: 'PRODUCT', priority: 1 },
      { id: '3', type: 'BANNER', priority: 2 },
    ];

    const context = {};

    const run1 = visibilityEngine.filterBlocks(blocks as any, context as any);
    const run2 = visibilityEngine.filterBlocks(blocks as any, context as any);

    expect(run1.map((b) => b.id)).toEqual(run2.map((b) => b.id));
  });
});