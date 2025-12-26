import { HttpErrorResponse, HttpInterceptorFn, HttpResponseBase } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, of, throwError, mergeMap, catchError } from 'rxjs';

import { toLogin } from '../net/helper';
import { tryRefreshToken } from '../net/refresh-token';

/**
 * Handle 401 with optional refresh-token retry (re-request mode).
 */
export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);

  const handle401 = (ev: HttpResponseBase) => {
    if (environment.api.refreshTokenEnabled && environment.api.refreshTokenType === 're-request') {
      return tryRefreshToken(injector, ev, req, next);
    }
    toLogin(injector);
    return throwError(() => ev);
  };

  return next(req).pipe(
    mergeMap(ev => {
      if (ev instanceof HttpResponseBase && ev.status === 401) {
        return handle401(ev);
      }
      return of(ev);
    }),
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        return handle401(err);
      }
      return throwError(() => err);
    })
  );
};
