import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Grab the token from local storage
  const token = localStorage.getItem('token');

  // If a token exists, clone the request and attach the Authorization header
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    // Send the cloned request with the token onward
    return next(clonedReq);
  }

  // If there is no token, just send the original request
  return next(req);
};