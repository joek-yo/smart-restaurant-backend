// src/modules/smartpage/tests/image-selection.spec.ts

import { Test } from '@nestjs/testing';
import { ImageSelectionService } from '../application/image-engine/image-selection.service';
import { ImagePolicyEngine } from '../application/image-engine/image-policy.engine';

/**
 * IMAGE SELECTION TEST
 * -----------------------------------------------------
 * Validates:
 * - correct image selection per block
 * - fallback behavior
 * - policy enforcement
 * - optimization rules
 */

describe('ImageSelectionService', () => {
  let service: ImageSelectionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ImageSelectionService,

        {
          provide: ImagePolicyEngine,
          useValue: {
            applyPolicy: jest.fn((image) => ({
              ...image,
              optimized: true,
              policyApplied: true,
            })),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(ImageSelectionService);
  });

  it('should select primary image when available', () => {
    const block = {
      id: 'block_1',
      type: 'PRODUCT',
      payload: {
        images: [
          { url: 'img1.jpg', priority: 2 },
          { url: 'img2.jpg', priority: 1 },
        ],
      },
    };

    const result = service.selectBestImage(block);

    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
  });

  it('should fallback when no images exist', () => {
    const block = {
      id: 'block_2',
      type: 'PRODUCT',
      payload: {
        images: [],
      },
    };

    const result = service.selectBestImage(block);

    expect(result).toBeDefined();
    expect(result.url).toContain('fallback');
  });

  it('should respect image priority ordering', () => {
    const block = {
      id: 'block_3',
      type: 'PRODUCT',
      payload: {
        images: [
          { url: 'low.jpg', priority: 10 },
          { url: 'high.jpg', priority: 1 },
        ],
      },
    };

    const result = service.selectBestImage(block);

    expect(result.url).toBe('high.jpg');
  });

  it('should apply image policy engine before returning image', () => {
    const block = {
      id: 'block_4',
      type: 'HERO',
      payload: {
        images: [{ url: 'hero.jpg', priority: 1 }],
      },
    };

    const result = service.selectBestImage(block);

    expect(result.optimized).toBe(true);
    expect(result.policyApplied).toBe(true);
  });

  it('should handle missing payload safely', () => {
    const block = {
      id: 'block_5',
      type: 'PRODUCT',
    };

    const result = service.selectBestImage(block);

    expect(result).toBeDefined();
    expect(result.url).toContain('fallback');
  });
});