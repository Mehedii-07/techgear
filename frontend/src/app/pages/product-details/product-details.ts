import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Product } from '../../core/models/models';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.scss']
})
export class ProductDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cart = inject(CartService);
  auth = inject(AuthService);

  product = signal<Product | null>(null);
  quantity = signal<number>(1);
  reviews = signal<any[]>([]);
  
  newReviewText = '';
  newReviewRating = 5;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchProduct(Number(id));
        this.fetchReviews(Number(id));
      }
    });
  }

  fetchProduct(id: number) {
    this.http.get<Product>(`${environment.apiUrl}/products/${id}`)
      .subscribe(res => this.product.set(res));
  }

  fetchReviews(id: number) {
    this.http.get<any[]>(`${environment.apiUrl}/reviews/${id}`)
      .subscribe(res => this.reviews.set(res));
  }

  addToCart() {
    const p = this.product();
    if (p) {
      this.cart.addToCart(p, this.quantity());
    }
  }

  submitReview() {
    const p = this.product();
    if (p && this.auth.isAuthenticated()) {
      const payload = {
        product_id: p.id,
        rating: this.newReviewRating,
        text: this.newReviewText
      };
      this.http.post(`${environment.apiUrl}/reviews`, payload).subscribe({
        next: () => {
          this.newReviewText = '';
          this.fetchReviews(p.id);
        }
      });
    }
  }
}
