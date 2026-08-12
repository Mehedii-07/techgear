import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';

  onSubmit() {
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/']); // Go to catalog on success
      },
      error: (err) => {
        this.errorMessage = err.error.detail || 'Login failed. Please try again.';
      }
    });
  }
}