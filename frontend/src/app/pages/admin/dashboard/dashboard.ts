import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
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

  revenueChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  revenueChartOptions: ChartConfiguration<'line'>['options'] = { responsive: true };

  growthChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  growthChartOptions: ChartConfiguration<'bar'>['options'] = { responsive: true };

  activeTab = 'analytics'; // 'analytics', 'users', 'products', 'orders', 'profile'
  users = signal<any[]>([]);

  // Profile State
  adminUser: any = null;
  adminName = '';
  adminPhone = '';
  isSavingProfile = false;
  profileSuccess = '';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });
    this.fetchAnalytics();
    this.fetchUsers();
    this.fetchAdminProfile();
    this.http.get<any[]>(`${environment.apiUrl}/orders`).subscribe(res => {
      this.orders.set(res);
    });
    this.http.get<any[]>(`${environment.apiUrl}/categories`).subscribe(res => {
      this.categories.set(res);
    });
    this.loadProducts();
  }

  fetchAdminProfile() {
    this.http.get(`${environment.apiUrl}/users/me`).subscribe((res: any) => {
      this.adminUser = res;
      this.adminName = res.name || '';
      this.adminPhone = res.phone_number || '';
    });
  }

  saveAdminProfile() {
    this.isSavingProfile = true;
    this.profileSuccess = '';
    
    this.http.put(`${environment.apiUrl}/users/me`, { 
      name: this.adminName, 
      phone_number: this.adminPhone 
    }).subscribe({
      next: (res: any) => {
        this.adminUser = res;
        this.profileSuccess = "Profile updated successfully!";
        this.isSavingProfile = false;
        setTimeout(() => this.profileSuccess = '', 3000);
      },
      error: () => {
        this.isSavingProfile = false;
        alert("Failed to update profile.");
      }
    });
  }

  fetchAnalytics() {
    this.http.get<any>(`${environment.apiUrl}/admin/analytics`).subscribe(res => {
      this.metrics.set(res);
      this.revenueChartData = {
        labels: res.revenue_graph.map((r: any) => r.date),
        datasets: [{ data: res.revenue_graph.map((r: any) => r.total), label: 'Revenue ($)', borderColor: '#f39c12', tension: 0.1 }]
      };
      this.growthChartData = {
        labels: res.customer_growth.map((r: any) => r.month),
        datasets: [{ data: res.customer_growth.map((r: any) => r.new_users), label: 'New Users', backgroundColor: '#3498db' }]
      };
    });
  }

  fetchUsers() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/users`).subscribe(res => {
      this.users.set(res);
    });
  }

  toggleUserBan(userId: number) {
    if(confirm('Are you sure you want to change this user\'s ban status?')) {
      this.http.put(`${environment.apiUrl}/admin/users/${userId}/ban`, {}).subscribe({
        next: () => this.fetchUsers(),
        error: (err) => alert(err.error.detail)
      });
    }
  }

  toggleUserRole(userId: number) {
    if(confirm('Are you sure you want to change this user\'s role?')) {
      this.http.put(`${environment.apiUrl}/admin/users/${userId}/role`, {}).subscribe({
        next: () => this.fetchUsers(),
        error: (err) => alert(err.error.detail)
      });
    }
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

  trackingData: { [orderId: number]: { tracking_number: string, courier_name: string, estimated_delivery: string } } = {};

  toggleOrderDetails(orderId: number) {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
    if (this.expandedOrderId) {
      const order = this.orders().find(o => o.id === orderId);
      if (order && !this.trackingData[orderId]) {
        let estDelivery = '';
        if (order.estimated_delivery) {
          estDelivery = new Date(order.estimated_delivery).toISOString().split('T')[0];
        }
        this.trackingData[orderId] = {
          tracking_number: order.tracking_number || '',
          courier_name: order.courier_name || '',
          estimated_delivery: estDelivery
        };
      }
    }
  }

  updateTracking(orderId: number) {
    const data = this.trackingData[orderId];
    if (!data.tracking_number || !data.courier_name || !data.estimated_delivery) {
      alert('Please fill out all tracking fields.');
      return;
    }
    
    const payload = {
      tracking_number: data.tracking_number,
      courier_name: data.courier_name,
      estimated_delivery: new Date(data.estimated_delivery).toISOString()
    };
    
    this.http.put(`${environment.apiUrl}/admin/orders/${orderId}/tracking`, payload).subscribe({
      next: () => {
        alert('Tracking information updated successfully!');
        this.http.get<any[]>(`${environment.apiUrl}/orders`).subscribe(res => {
          this.orders.set(res);
        });
      },
      error: (err) => alert('Failed to update tracking: ' + (err.error?.detail || err.message))
    });
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

  processRefund(orderId: number) {
    if (confirm('Are you sure you want to mark this refund as processed?')) {
      this.http.put(`${environment.apiUrl}/admin/orders/${orderId}/refund`, {}).subscribe({
        next: () => {
          alert('Refund processed successfully.');
          this.http.get<any[]>(`${environment.apiUrl}/orders`).subscribe(res => {
            this.orders.set(res);
          });
        },
        error: (err) => alert('Failed to process refund: ' + err.error.detail)
      });
    }
  }
}
