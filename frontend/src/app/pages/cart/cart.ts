import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.html',
  styleUrls: ['./cart.scss']
})
export class CartComponent {
  cart = inject(CartService);

  updateQuantity(productId: number, event: any) {
    const qty = Number(event.target.value);
    this.cart.updateQuantity(productId, qty);
  }

  removeItem(productId: number) {
    this.cart.removeFromCart(productId);
  }
}
