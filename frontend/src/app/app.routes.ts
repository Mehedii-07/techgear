import { Routes } from '@angular/router';
import { CatalogComponent } from './components/catalog/catalog'; 
import { ProductDetailsComponent } from './components/product-details/product-details'; 

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'product/:id', component: ProductDetailsComponent } 
];