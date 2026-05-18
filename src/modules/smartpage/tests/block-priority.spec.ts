// src/modules/smartpage/tests/block-priority.spec.ts

import { SmartpagePersonalizationService, RecommendationContext } from '../application/ai/smartpage-personalization.service';

describe('SmartpagePersonalizationService', () => {
  let service: SmartpagePersonalizationService;

  beforeAll(() => {
    service = new SmartpagePersonalizationService();
  });

  it('should return HERO + CATALOG for PRODUCT_DISCOVERY strategy', () => {
    const ctx: RecommendationContext = { strategy: 'PRODUCT_DISCOVERY' };
    const result = service.recommend(ctx);
    expect(result.blocks).toContain('HERO');
    expect(result.blocks).toContain('CATALOG');
    expect(result.reasoning).toBeDefined();
  });

  it('should add RECOMMENDATION block for returning user on PRODUCT_DISCOVERY', () => {
    const ctx: RecommendationContext = {
      strategy: 'PRODUCT_DISCOVERY',
      isReturningUser: true,
    };
    const result = service.recommend(ctx);
    expect(result.blocks).toContain('RECOMMENDATION');
  });

  it('should return PRODUCT block for PRODUCT_DETAIL strategy', () => {
    const ctx: RecommendationContext = { strategy: 'PRODUCT_DETAIL' };
    const result = service.recommend(ctx);
    expect(result.blocks).toContain('PRODUCT');
  });

  it('should add CART block on PRODUCT_DETAIL when cart exists', () => {
    const ctx: RecommendationContext = {
      strategy: 'PRODUCT_DETAIL',
      hasCart: true,
    };
    const result = service.recommend(ctx);
    expect(result.blocks).toContain('CART');
  });

  it('should return CART + RECOMMENDATION for CART_OVERVIEW strategy', () => {
    const ctx: RecommendationContext = { strategy: 'CART_OVERVIEW' };
    const result = service.recommend(ctx);
    expect(result.blocks).toContain('CART');
    expect(result.blocks).toContain('RECOMMENDATION');
  });

  it('should add BANNER when cart has more than 2 items on CART_OVERVIEW', () => {
    const ctx: RecommendationContext = {
      strategy: 'CART_OVERVIEW',
      cartItemCount: 3,
    };
    const result = service.recommend(ctx);
    expect(result.blocks).toContain('BANNER');
  });

  it('should return CHECKOUT block for CHECKOUT_FOCUSED strategy', () => {
    const ctx: RecommendationContext = { strategy: 'CHECKOUT_FOCUSED' };
    const result = service.recommend(ctx);
    expect(result.blocks).toContain('CHECKOUT');
  });

  it('should return HERO + CATALOG + RECOMMENDATION for HERO_BRANDED_HOME', () => {
    const ctx: RecommendationContext = { strategy: 'HERO_BRANDED_HOME' };
    const result = service.recommend(ctx);
    expect(result.blocks).toContain('HERO');
    expect(result.blocks).toContain('CATALOG');
    expect(result.blocks).toContain('RECOMMENDATION');
  });

  it('should fallback to HERO + CATALOG for unknown strategy', () => {
    const ctx = { strategy: 'UNKNOWN_STRATEGY' as any };
    const result = service.recommend(ctx);
    expect(result.blocks).toContain('HERO');
    expect(result.blocks).toContain('CATALOG');
  });
});
