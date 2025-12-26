import { HttpInterceptorFn } from '@angular/common/http';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { inject } from '@angular/core';

/**
 * Attach bearer token from @delon/auth if present.
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(DA_SERVICE_TOKEN);
  const token = tokenService.get()?.token;

  if (!token || req.headers.has('Authorization')) {
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(cloned);
};
