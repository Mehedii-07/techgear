import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.html',
  styles: [`
    .account-layout {
      display: flex;
      min-height: calc(100vh - 70px);
      background-color: #fcfcfc;
    }
    
    .sidebar {
      width: 250px;
      background-color: #fff;
      border-right: 1px solid #eee;
      padding: 2rem 1rem;
      
      .sidebar-brand {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 2rem;
        padding-left: 1rem;
        color: var(--text-main);
      }
      
      .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        
        button {
          text-align: left;
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          border-radius: var(--border-radius);
          color: var(--text-sub);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          
          &:hover {
            background-color: #f8f9fa;
            color: var(--primary-color);
          }
          
          &.active {
            background-color: var(--primary-color);
            color: #fff;
          }
        }
      }
    }
    
    .account-content {
      flex: 1;
      padding: 2rem;
      
      @media (max-width: 768px) {
        padding: 1rem;
      }
    }

    /* Profile Styles */
    .profile-card { max-width: 600px; padding: 2rem; background: #fff; border-radius: var(--border-radius); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; }
    .success-msg { color: #155724; background: #d4edda; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
    .readonly-field { background-color: #f8f9fa; cursor: not-allowed; }

    /* Orders Styles */
    .order-card { margin-bottom: 1.5rem; padding: 1.5rem; background: #fff; border-radius: var(--border-radius); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .order-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem; }
    .date { color: var(--text-sub); font-size: 0.9rem; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; }
    .status-badge.pending { background: #fff3cd; color: #856404; }
    .status-badge.processing { background: #cce5ff; color: #004085; }
    .status-badge.shipped { background: #d4edda; color: #155724; }
    .status-badge.delivered { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .status-badge.cancelled { background: #f8d7da; color: #721c24; }
    .tracking-info { background-color: #f8f9fa; padding: 1rem; border-radius: var(--border-radius); p { margin-bottom: 0.25rem; font-size: 0.9rem; } }
    
    .timeline {
      display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #eee;
      .step {
        flex: 1; text-align: center; font-size: 0.85rem; color: var(--text-sub); position: relative;
        &::before { content: ''; display: block; width: 12px; height: 12px; border-radius: 50%; background: #ddd; margin: 0 auto 0.5rem; }
        &.active { color: var(--primary-color); font-weight: 600; &::before { background: var(--primary-color); } }
      }
    }
  `]
})
export class AccountComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  
  activeTab = 'profile'; // 'profile', 'orders'
  
  // Profile State
  user: any = null;
  name = '';
  phoneNumber = '';
  isSavingProfile = false;
  profileSuccess = '';

  // Orders State
  orders = signal<any[]>([]);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });
    this.fetchProfile();
    this.fetchOrders();
  }

  fetchProfile() {
    this.http.get(`${environment.apiUrl}/users/me`).subscribe((res: any) => {
      this.user = res;
      this.name = res.name || '';
      this.phoneNumber = res.phone_number || '';
    });
  }

  saveProfile() {
    this.isSavingProfile = true;
    this.profileSuccess = '';
    
    this.http.put(`${environment.apiUrl}/users/me`, { 
      name: this.name, 
      phone_number: this.phoneNumber 
    }).subscribe({
      next: (res: any) => {
        this.user = res;
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

  fetchOrders() {
    this.http.get<any[]>(`${environment.apiUrl}/orders/my-orders`).subscribe(res => {
      res.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      this.orders.set(res);
    });
  }

  cancelOrder(orderId: number) {
    if (confirm('Are you sure you want to cancel this order?')) {
      this.http.put(`${environment.apiUrl}/orders/${orderId}/cancel`, {}).subscribe({
        next: () => this.fetchOrders(),
        error: (err) => alert('Failed to cancel order: ' + err.error.detail)
      });
    }
  }

  requestRefund(orderId: number) {
    if (confirm('Are you sure you want to request a return/refund for this order?')) {
      this.http.post(`${environment.apiUrl}/orders/${orderId}/refund-request`, {}).subscribe({
        next: () => this.fetchOrders(),
        error: (err) => alert('Failed to request refund: ' + err.error.detail)
      });
    }
  }
}
