import { Injectable, signal, computed } from '@angular/core';
import { Product } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // The state of our cart, initialized as an empty array
  cartItems = signal<CartItem[]>([]);

  // Automatically calculates the total number of items
  totalItems = computed(() => {
    return this.cartItems().reduce((total, item) => total + item.quantity, 0);
  });

  // Automatically calculates the total price
  totalPrice = computed(() => {
    return this.cartItems().reduce((total, item) => total + (item.product.price * item.quantity), 0);
  });

  addToCart(product: Product) {
    this.cartItems.update(items => {
      const existingItem = items.find(i => i.product.id === product.id);
      
      if (existingItem) {
        // If it's already in the cart, just increase the quantity
        return items.map(i => 
          i.product.id === product.id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      } else {
        // Otherwise, add it as a new item
        return [...items, { product, quantity: 1 }];
      }
    });
  }

  removeFromCart(productId: number) {
    this.cartItems.update(items => items.filter(i => i.product.id !== productId));
  }

  clearCart() {
    this.cartItems.set([]);
  }
}