import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let token = null;

  // Only try to access localStorage if we are in the browser!
  if (typeof localStorage !== 'undefined') {
    token = localStorage.getItem('token');
  }

  // If a token exists, clone the request and attach the Authorization header
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  // If there is no token, just send the original request
  return next(req);
};