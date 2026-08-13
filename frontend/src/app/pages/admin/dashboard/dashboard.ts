import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  metrics = signal<any>(null);
  orders = signal<any[]>([]);
  categories = signal<any[]>([]);
  products = signal<any[]>([]);
  
  editingProductId: number | null = null;
  expandedOrderId: number | null = null;

  newProduct = {
    name: '',
    price: 0,
    stock: 0,
    description: '',
    image_url: '',
    category_id: null as number | null
  };

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/admin/dashboard`).subscribe(res => {
      this.metrics.set(res.metrics);
    });
    this.http.get<any[]>(`${environment.apiUrl}/orders`).subscribe(res => {
      this.orders.set(res);
    });
    this.http.get<any[]>(`${environment.apiUrl}/categories`).subscribe(res => {
      this.categories.set(res);
    });
    this.loadProducts();
  }

  loadProducts() {
    this.http.get<any[]>(`${environment.apiUrl}/products`).subscribe(res => {
      this.products.set(res);
    });
  }

  editProduct(p: any) {
    this.editingProductId = p.id;
    this.newProduct = {
      name: p.name,
      price: p.price,
      stock: p.stock,
      description: p.description || '',
      image_url: p.image_url || '',
      category_id: p.category_id
    };
    // Scroll to form
    document.querySelector('.add-product-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingProductId = null;
    this.newProduct = { name: '', price: 0, stock: 0, description: '', image_url: '', category_id: null };
  }

  createProduct() {
    const payload: any = { ...this.newProduct };
    if (!payload.category_id || payload.category_id === 'null' || payload.category_id === null) {
      delete payload.category_id;
    } else {
      payload.category_id = Number(payload.category_id);
    }
    
    if (this.editingProductId) {
      this.http.put(`${environment.apiUrl}/products/${this.editingProductId}`, payload).subscribe({
        next: () => {
          alert('Product updated successfully!');
          this.cancelEdit();
          this.loadProducts();
        },
        error: (err) => {
          alert('Failed to update product: ' + (err.error?.detail || err.message));
        }
      });
    } else {
      this.http.post(`${environment.apiUrl}/products`, payload).subscribe({
        next: () => {
          alert('Product created successfully!');
          this.cancelEdit();
          this.loadProducts();
        },
        error: (err) => {
          alert('Failed to create product: ' + (err.error?.detail || err.message));
        }
      });
    }
  }

  deleteProduct(id: number) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    this.http.delete(`${environment.apiUrl}/products/${id}`).subscribe({
      next: () => {
        alert('Product deleted successfully!');
        this.loadProducts();
      },
      error: (err) => {
        alert('Failed to delete product: ' + (err.error?.detail || err.message));
      }
    });
  }

  toggleOrderDetails(orderId: number) {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  getProductDetails(productId: number): any {
    return this.products().find(p => p.id === productId) || { name: 'Unknown Product', price: 0 };
  }

  updateOrderStatus(orderId: number, status: string) {
    this.http.put(`${environment.apiUrl}/orders/${orderId}/status?status=${status}`, {}).subscribe(() => {
      // Reload orders
      this.http.get<any[]>(`${environment.apiUrl}/orders`).subscribe(res => {
        this.orders.set(res);
      });
    });
  }
}
