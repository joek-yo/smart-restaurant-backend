// src/modules/smartpage/tests/smartpage-renderer.spec.ts
import { Test } from '@nestjs/testing';
import { SmartPageRendererService } from '../application/renderer/smartpage-renderer.service';
import { BlockRendererService } from '../application/renderer/block-renderer.service';
import { VisibilityEngineService } from '../application/renderer/visibility-engine.service';
import { ContextResolverService } from '../application/renderer/context-resolver.service';
import { ImageSelectionService } from '../application/image-engine/image-selection.service';
import { SMARTPAGE_REPOSITORY } from '../domain/repositories/smartpage.repository';
import { ConversationState } from '@modules/conversation/domain/enums/conversation-state.enum';
import { SmartPageContextVO } from '../domain/value-objects/smartpage-context.vo';

const mockContext = (): SmartPageContextVO => ({
  tenantId: 'tenant_1',
  userId: 'user_1',
  session: { hasCart: false, cartItemCount: 0 },
  conversationState: ConversationState.IDLE,
  checkout: { active: false },
  channel: 'web',
  device: 'desktop',
  isAuthenticated: true,
  isReturningUser: false,
  features: {},
  timestamp: Date.now(),
  hasCart: false,
  cartItemCount: 0,
  isWebChannel: true,
  isWhatsAppChannel: false,
} as any);

describe('SmartPageRendererService', () => {
  let renderer: SmartPageRendererService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SmartPageRendererService,
        {
          provide: SMARTPAGE_REPOSITORY,
          useValue: {
            findByTenant: jest.fn().mockResolvedValue(null),
            save: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: BlockRendererService,
          useValue: {
            render: jest.fn().mockResolvedValue([
              { id: 'block_1', type: 'HERO', rendered: true },
            ]),
          },
        },
        {
          provide: VisibilityEngineService,
          useValue: {
            filter: jest.fn((blocks) => blocks),
          },
        },
        {
          provide: ContextResolverService,
          useValue: {
            resolve: jest.fn().mockResolvedValue(mockContext()),
          },
        },
        {
          provide: ImageSelectionService,
          useValue: {
            select: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    renderer = moduleRef.get(SmartPageRendererService);
  });

  it('should be defined', () => {
    expect(renderer).toBeDefined();
  });

  it('should have a render or generate method', () => {
    const methods = Object.getOwnPropertyNames(
      Object.getPrototypeOf(renderer)
    );
    const hasRenderMethod = methods.some(m =>
      ['render', 'generate', 'build', 'renderPage'].includes(m)
    );
    expect(hasRenderMethod).toBe(true);
  });
});
