import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if the user is logged in using the signal we created earlier
  if (authService.isLoggedIn()) {
    return true; // Let them pass!
  } else {
    // Not logged in? Send them to the login page
    router.navigate(['/login']);
    return false; // Block the route!
  }
};