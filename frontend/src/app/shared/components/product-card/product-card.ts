import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../core/models/models';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss']
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  cart = inject(CartService);

  addToCart(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.cart.addToCart(this.product, 1);
  }
}
