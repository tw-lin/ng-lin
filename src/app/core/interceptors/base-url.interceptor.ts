import { HttpInterceptorFn } from '@angular/common/http';
import { IGNORE_BASE_URL } from '@delon/theme';
import { environment } from '@env/environment';

import { getAdditionalHeaders } from '../net/helper';

/**
 * Prepend base URL and attach shared headers (e.g., Accept-Language).
 */
export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  let url = req.url;

  if (!req.context.get(IGNORE_BASE_URL) && !url.startsWith('https://') && !url.startsWith('http://')) {
    const { baseUrl } = environment.api;
    url = baseUrl + (baseUrl.endsWith('/') && url.startsWith('/') ? url.substring(1) : url);
  }

  const cloned = req.clone({ url, setHeaders: getAdditionalHeaders(req.headers) });
  return next(cloned);
};
