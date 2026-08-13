import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styles: [`
    .auth-container { max-width: 400px; margin: 4rem auto; padding: 2rem; }
    h2 { text-align: center; margin-bottom: 1.5rem; color: var(--text-main); }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; }
    button { width: 100%; margin-top: 1rem; }
    .footer-links { text-align: center; margin-top: 1.5rem; font-size: 0.9rem; }
    .success-msg { color: #155724; background: #d4edda; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; text-align: center; }
  `]
})
export class ForgotPasswordComponent {
  private http = inject(HttpClient);
  
  email = '';
  successMessage = '';
  isLoading = false;

  submit() {
    if (!this.email) return;
    this.isLoading = true;
    this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email: this.email }).subscribe({
      next: (res: any) => {
        this.successMessage = res.message;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        // Do not reveal if email exists, just show success message anyway
        this.successMessage = "If that email is in our system, we have sent a password reset link.";
      }
    });
  }
}
