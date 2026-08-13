import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.scss']
})
export class OrdersComponent implements OnInit {
  private http = inject(HttpClient);
  orders = signal<any[]>([]);

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/orders/my-orders`).subscribe(res => {
      // Sort orders by created_at descending
      res.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      this.orders.set(res);
    });
  }
}
