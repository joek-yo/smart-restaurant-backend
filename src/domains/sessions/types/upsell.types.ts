// 📁 src/domains/sessions/types/upsell.types.ts

export interface UpsellRecommendation {
  id: string;
  productId: string;
  name: string;
  price: number;
  reason: string; // e.g., "Customers also bought", "Combo deal"
}

export interface UpsellBundle {
  id: string;
  name: string;
  items: UpsellRecommendation[];
  discountPercentage?: number;
}

export type UpsellResult = {
  sessionId: string;
  recommendations: UpsellRecommendation[];
  bundles?: UpsellBundle[];
};