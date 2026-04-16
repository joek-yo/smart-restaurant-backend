// FILE: src/domains/sessions/value-objects/cart-item.vo.ts

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