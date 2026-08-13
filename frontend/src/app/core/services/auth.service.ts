import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { User } from '../models/models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  isAdmin = signal<boolean>(false);
  isInitialized = signal<boolean>(false);

  constructor() {
    this.checkInitialAuth();
  }

  private checkInitialAuth() {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        this.fetchCurrentUser().subscribe({
          next: () => this.isInitialized.set(true),
          error: () => this.isInitialized.set(true)
        });
        return;
      }
    }
    this.isInitialized.set(true);
  }

  login(credentials: any): Observable<any> {
    const formData = new URLSearchParams();
    formData.set('username', credentials.email);
    formData.set('password', credentials.password);
    
    return this.http.post<{access_token: string}>(`${environment.apiUrl}/login`, formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(res => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('token', res.access_token);
        }
        this.fetchCurrentUser().subscribe();
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/register`, userData);
  }

  fetchCurrentUser(): Observable<User | null> {
    return this.http.get<User>(`${environment.apiUrl}/users/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        this.isAdmin.set(user.role === 'admin');
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  logout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.isAdmin.set(false);
    this.router.navigate(['/login']);
  }
}
