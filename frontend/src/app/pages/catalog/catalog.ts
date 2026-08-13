import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ActivatedRoute } from '@angular/router';
import { Product, Category } from '../../core/models/models';
import { ProductCardComponent } from '../../shared/components/product-card/product-card';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './catalog.html',
  styleUrls: ['./catalog.scss']
})
export class CatalogComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  selectedCategory = signal<number | null>(null);
  searchQuery = signal<string>('');

  ngOnInit() {
    this.fetchCategories();
    this.route.queryParams.subscribe(params => {
      this.searchQuery.set(params['search'] || '');
      this.fetchProducts();
    });
  }

  fetchCategories() {
    this.http.get<Category[]>(`${environment.apiUrl}/categories`)
      .subscribe(res => this.categories.set(res));
  }

  fetchProducts() {
    let url = `${environment.apiUrl}/products?limit=50`;
    if (this.selectedCategory()) {
      url += `&category_id=${this.selectedCategory()}`;
    }
    if (this.searchQuery()) {
      url += `&search=${encodeURIComponent(this.searchQuery())}`;
    }
    this.http.get<Product[]>(url).subscribe(res => this.products.set(res));
  }

  selectCategory(categoryId: number | null) {
    this.selectedCategory.set(categoryId);
    this.fetchProducts();
  }
}
