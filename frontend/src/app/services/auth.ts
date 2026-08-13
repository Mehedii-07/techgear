import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000';

  // We use a Signal to track if the user is currently logged in
  isLoggedIn = signal<boolean>(this.hasToken());

  private hasToken(): boolean {
    // Only access localStorage in the browser
    if (typeof localStorage !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  }

  register(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { email, password });
  }

  login(email: string, password: string): Observable<any> {
    // FastAPI's OAuth2 expects form-urlencoded data, with the email in the "username" field
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(`${this.apiUrl}/login`, body.toString(), { headers }).pipe(
      tap((res: any) => {
        // Save the token and update the signal
        localStorage.setItem('token', res.access_token);
        this.isLoggedIn.set(true);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.isLoggedIn.set(false);
  }
}