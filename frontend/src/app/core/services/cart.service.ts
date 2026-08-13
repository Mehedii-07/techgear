import { Injectable, signal, computed } from '@angular/core';
import { Product, CartItem } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  items = signal<CartItem[]>([]);

  totalItems = computed(() => {
    return this.items().reduce((acc, item) => acc + item.quantity, 0);
  });

  totalPrice = computed(() => {
    return this.items().reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  });

  constructor() {
    this.loadCart();
  }

  addToCart(product: Product, quantity: number = 1) {
    this.items.update(currentItems => {
      const existing = currentItems.find(i => i.product.id === product.id);
      if (existing) {
        return currentItems.map(i => 
          i.product.id === product.id 
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        return [...currentItems, { product, quantity }];
      }
    });
    this.saveCart();
  }

  removeFromCart(productId: number) {
    this.items.update(items => items.filter(i => i.product.id !== productId));
    this.saveCart();
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this.items.update(items => 
      items.map(i => i.product.id === productId ? { ...i, quantity } : i)
    );
    this.saveCart();
  }

  clearCart() {
    this.items.set([]);
    this.saveCart();
  }

  private saveCart() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(this.items()));
    }
  }

  private loadCart() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('cart');
      if (saved) {
        try {
          this.items.set(JSON.parse(saved));
        } catch (e) {
          this.items.set([]);
        }
      }
    }
  }
}
