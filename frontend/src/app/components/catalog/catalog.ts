import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../../services/product';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss' // Updated to the modern singular styleUrl
})
export class CatalogComponent implements OnInit {
  private productService = inject(ProductService);
  products: Product[] = [];

  ngOnInit(): void {
    this.productService.getProducts().subscribe((data) => {
      this.products = data;
    });
  }
}