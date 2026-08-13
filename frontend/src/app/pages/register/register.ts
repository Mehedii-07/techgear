import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  auth = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';
  errorMsg = signal('');
  loading = signal(false);

  register() {
    this.loading.set(true);
    this.errorMsg.set('');
    this.auth.register({ email: this.email, password: this.password }).subscribe({
      next: () => {
        // Log them in immediately
        this.auth.login({ email: this.email, password: this.password }).subscribe({
          next: () => {
            this.loading.set(false);
            this.router.navigate(['/']);
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.detail || 'Registration failed');
      }
    });
  }
}
