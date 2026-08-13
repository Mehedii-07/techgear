import { Component, inject, OnInit } from '@angular/core';
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
export class CheckoutComponent implements OnInit {
  cart = inject(CartService);
  private http = inject(HttpClient);
  private router = inject(Router);

  addresses: any[] = [];
  selectedAddressId: number | 'new' = 'new';

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

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/addresses`).subscribe(res => {
      this.addresses = res;
      if (this.addresses.length > 0) {
        this.selectedAddressId = this.addresses[0].id;
      }
    });
  }

  processCheckout() {
    this.loading = true;
    this.errorMsg = '';
    
    if (this.selectedAddressId === 'new') {
      // 1. Create Address
      this.http.post<any>(`${environment.apiUrl}/addresses`, this.address).subscribe({
        next: (addr) => {
          this.createOrder(addr.id);
        },
        error: () => {
          this.loading = false;
          this.errorMsg = 'Failed to save address.';
        }
      });
    } else {
      this.createOrder(this.selectedAddressId as number);
    }
  }

  createOrder(addressId: number) {
    const orderPayload = {
      items: this.cart.items().map(i => ({ product_id: i.product.id, quantity: i.quantity })),
      address_id: addressId,
      transaction_id: this.transaction_id
    };
    this.http.post(`${environment.apiUrl}/checkout`, orderPayload).subscribe({
      next: () => {
        this.cart.clearCart();
        this.loading = false;
        this.router.navigate(['/account']);
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Failed to place order.';
      }
    });
  }
}
