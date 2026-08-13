import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isInitialized).pipe(
    filter(init => init === true),
    take(1),
    map(() => {
      if (authService.isAuthenticated() && authService.isAdmin()) {
        return true;
      }
      return router.parseUrl('/');
    })
  );
};
