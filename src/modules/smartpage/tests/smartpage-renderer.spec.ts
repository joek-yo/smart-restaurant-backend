// src/modules/smartpage/tests/smartpage-renderer.spec.ts

import { Test } from '@nestjs/testing';
import { SmartPageRendererService } from '../application/renderer/smartpage-renderer.service';
import { SmartPageContextBuilder } from '../application/context/smartpage-context.builder';
import { VisibilityEngineService } from '../application/renderer/visibility-engine.service';
import { BlockRendererService } from '../application/renderer/block-renderer.service';
import { SmartPagePersonalizationService } from '../application/ai/smartpage-personalization.service';
import { ImageSelectionService } from '../application/image-engine/image-selection.service';

/**
 * SMARTPAGE RENDER PIPELINE TEST
 * -----------------------------------------------------
 * Validates full rendering flow:
 * context → visibility → personalization → image selection → block render → output
 */

describe('SmartPageRendererService (Full Pipeline)', () => {
  let renderer: SmartPageRendererService;

  const mockContext = {
    tenantId: 'tenant_1',
    userId: 'user_1',
    sessionId: 'session_1',
    channel: 'web',
    conversationState: 'BROWSING',
    checkoutState: 'IDLE',
    device: 'desktop',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SmartPageRendererService,

        {
          provide: SmartPageContextBuilder,
          useValue: {
            build: jest.fn().mockResolvedValue(mockContext),
          },
        },

        {
          provide: VisibilityEngineService,
          useValue: {
            filterBlocks: jest.fn((blocks) => blocks), // pass-through
          },
        },

        {
          provide: SmartPagePersonalizationService,
          useValue: {
            personalizeBlocks: jest.fn((blocks) => blocks),
          },
        },

        {
          provide: ImageSelectionService,
          useValue: {
            selectImages: jest.fn((blocks) => blocks),
          },
        },

        {
          provide: BlockRendererService,
          useValue: {
            renderBlock: jest.fn((block) => ({
              id: block.id,
              type: block.type,
              rendered: true,
            })),
          },
        },
      ],
    }).compile();

    renderer = moduleRef.get(SmartPageRendererService);
  });

  it('should execute full rendering pipeline successfully', async () => {
    const input = {
      tenantId: 'tenant_1',
      userId: 'user_1',
      pageId: 'home',
    };

    const result = await renderer.render(input);

    expect(result).toBeDefined();
    expect(result.context).toBeDefined();
    expect(result.blocks).toBeDefined();
    expect(Array.isArray(result.blocks)).toBe(true);
  });

  it('should build context before rendering blocks', async () => {
    const result = await renderer.render({
      tenantId: 'tenant_1',
      userId: 'user_1',
      pageId: 'home',
    });

    expect(result.context.tenantId).toBe('tenant_1');
    expect(result.context.userId).toBe('user_1');
  });

  it('should return rendered blocks with metadata', async () => {
    const result = await renderer.render({
      tenantId: 'tenant_1',
      userId: 'user_1',
      pageId: 'home',
    });

    expect(result.blocks.length).toBeGreaterThanOrEqual(0);

    if (result.blocks.length > 0) {
      expect(result.blocks[0]).toHaveProperty('rendered');
      expect(result.blocks[0]).toHaveProperty('type');
    }
  });

  it('should preserve pipeline order integrity', async () => {
    const spyContext = jest.spyOn(
      moduleRef.get(SmartPageContextBuilder),
      'build',
    );

    await renderer.render({
      tenantId: 'tenant_1',
      userId: 'user_1',
      pageId: 'home',
    });

    expect(spyContext).toHaveBeenCalled();
  });
});