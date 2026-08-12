import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';

  onSubmit() {
    this.authService.register(this.email, this.password).subscribe({
      next: () => {
        alert('Registration successful! Please log in.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMessage = err.error.detail || 'Registration failed.';
      }
    });
  }
}