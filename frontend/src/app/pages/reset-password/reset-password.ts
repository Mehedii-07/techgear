import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styles: [`
    .auth-container { max-width: 400px; margin: 4rem auto; padding: 2rem; }
    h2 { text-align: center; margin-bottom: 1.5rem; color: var(--text-main); }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; }
    button { width: 100%; margin-top: 1rem; }
    .footer-links { text-align: center; margin-top: 1.5rem; font-size: 0.9rem; }
    .error-msg { color: #721c24; background: #f8d7da; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; text-align: center; }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  token = '';
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  isLoading = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.errorMessage = "Invalid or missing reset token.";
      }
    });
  }

  submit() {
    if (!this.token || !this.newPassword || this.newPassword !== this.confirmPassword) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.http.post(`${environment.apiUrl}/auth/reset-password`, { 
      token: this.token, 
      new_password: this.newPassword 
    }).subscribe({
      next: () => {
        alert("Password successfully reset!");
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || "Failed to reset password. Token may be expired.";
      }
    });
  }
}
