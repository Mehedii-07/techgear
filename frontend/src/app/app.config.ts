import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth'; // Import your interceptor

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Add withInterceptors to your HTTP client provider
    provideHttpClient(withInterceptors([authInterceptor])) 
  ]
};