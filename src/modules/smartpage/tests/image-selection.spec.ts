// src/modules/smartpage/tests/image-selection.spec.ts

import { Test } from '@nestjs/testing';
import { ImageSelectionService, ImageSelectionInput } from '../application/image-engine/image-selection.service';
import { ImagePolicyEngine } from '../application/image-engine/image-policy.engine';

describe('ImageSelectionService', () => {
  let service: ImageSelectionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ImageSelectionService,
        {
          provide: ImagePolicyEngine,
          useValue: {
            apply: jest.fn(() => ({
              optimized: true,
              policyApplied: true,
              url: 'https://cdn.app/optimized.jpg',
            })),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(ImageSelectionService);
  });

  it('should select highest resolution for HERO block', () => {
    const input: ImageSelectionInput = {
      blockType: 'HERO',
      variants: [
        { url: 'small.jpg', width: 400, height: 300 },
        { url: 'large.jpg', width: 1920, height: 1080 },
        { url: 'medium.jpg', width: 800, height: 600 },
      ],
      context: { isMobile: false },
    };

    const result = service.select(input);

    expect(result).toBeDefined();
    expect(result.selected.url).toBe('large.jpg');
    expect(result.reason).toBeDefined();
  });

  it('should select fastest loading for CATALOG block', () => {
    const input: ImageSelectionInput = {
      blockType: 'CATALOG',
      variants: [
        { url: 'large.jpg', width: 1920 },
        { url: 'tiny.jpg', width: 200 },
        { url: 'medium.jpg', width: 800 },
      ],
      context: { isMobile: true },
    };

    const result = service.select(input);

    expect(result.selected.url).toBe('tiny.jpg');
  });

  it('should select medium quality for PRODUCT block', () => {
    const input: ImageSelectionInput = {
      blockType: 'PRODUCT',
      variants: [
        { url: 'tiny.jpg', width: 200 },
        { url: 'medium.jpg', width: 1000 },
        { url: 'huge.jpg', width: 3000 },
      ],
      context: {},
    };

    const result = service.select(input);

    expect(result.selected.url).toBe('medium.jpg');
  });

  it('should return fallback when no variants provided', () => {
    const input: ImageSelectionInput = {
      blockType: 'PRODUCT',
      variants: [],
      context: {},
    };

    const result = service.select(input);

    expect(result.selected.url).toContain('fallback');
    expect(result.reason).toContain('fallback');
  });

  it('should apply image policy and return policy result', () => {
    const input: ImageSelectionInput = {
      blockType: 'HERO',
      variants: [{ url: 'hero.jpg', width: 1920, height: 1080 }],
      context: { isMobile: false },
    };

    const result = service.select(input);

    expect(result.policy).toBeDefined();
    expect(result.policy.optimized).toBe(true);
  });

  it('should select stable variant for CART block', () => {
    const input: ImageSelectionInput = {
      blockType: 'CART',
      variants: [
        { url: 'fancy.jpg', width: 1200, label: 'hero' },
        { url: 'stable.jpg', width: 800, label: 'stable' },
      ],
      context: {},
    };

    const result = service.select(input);

    expect(result.selected.label).toBe('stable');
  });
});
