import { Routes } from '@angular/router';
import { CatalogComponent } from './components/catalog/catalog'; 
import { ProductDetailsComponent } from './components/product-details/product-details'; 
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'product/:id', component: ProductDetailsComponent } ,
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }
];