// 📁 src/domains/sessions/value-objects/cart-item.vo.ts

/**
 * Value Object for individual items within a cart session.
 * Handled as immutable data structures within the domain.
 */
export class CartItemVO {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  options?: any;

  constructor(partial: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    options?: any;
  }) {
    this.productId = partial.productId;
    this.name = partial.name;
    this.quantity = partial.quantity;
    this.price = partial.price;
    this.options = partial.options;
  }

  /**
   * Returns the total cost for this specific line item.
   */
  get total(): number {
    return this.price * this.quantity;
  }

  /**
   * Creates a deep copy of the item to maintain immutability 
   * when performing domain logic updates.
   */
  clone(): CartItemVO {
    return new CartItemVO({
      productId: this.productId,
      name: this.name,
      quantity: this.quantity,
      price: this.price,
      options: this.options,
    });
  }
}