import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss']
})
export class CheckoutComponent {
  cart = inject(CartService);
  private http = inject(HttpClient);
  private router = inject(Router);

  address = {
    full_name: '',
    phone: '',
    address_line1: '',
    city: '',
    postal_code: ''
  };
  
  transaction_id = '';

  loading = false;
  errorMsg = '';

  processCheckout() {
    this.loading = true;
    this.errorMsg = '';
    
    // 1. Create Address
    this.http.post<any>(`${environment.apiUrl}/addresses`, this.address).subscribe({
      next: (addr) => {
        // 2. Create Order
        const orderPayload = {
          items: this.cart.items().map(i => ({ product_id: i.product.id, quantity: i.quantity })),
          address_id: addr.id,
          transaction_id: this.transaction_id
        };
        this.http.post(`${environment.apiUrl}/checkout`, orderPayload).subscribe({
          next: () => {
            this.cart.clearCart();
            this.loading = false;
            this.router.navigate(['/orders']);
          },
          error: () => {
            this.loading = false;
            this.errorMsg = 'Failed to place order.';
          }
        });
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Failed to save address.';
      }
    });
  }
}
