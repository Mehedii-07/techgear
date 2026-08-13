import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/catalog/catalog').then(m => m.CatalogComponent) 
  },
  { 
    path: 'product/:id', 
    loadComponent: () => import('./pages/product-details/product-details').then(m => m.ProductDetailsComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterComponent) 
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) 
  },
  { 
    path: 'reset-password', 
    loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPasswordComponent) 
  },
  { 
    path: 'account', 
    loadComponent: () => import('./pages/account/account').then(m => m.AccountComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'cart', 
    loadComponent: () => import('./pages/cart/cart').then(m => m.CartComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'checkout', 
    loadComponent: () => import('./pages/checkout/checkout').then(m => m.CheckoutComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./pages/admin/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [adminGuard]
  },
  { path: '**', redirectTo: '' }
];