import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

/** Endpoint công khai - 401 ở đây (vd. sai mật khẩu) không đồng nghĩa với hết phiên. */
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register'];

/** Gắn Bearer token cho request tới API backend, và tự đăng xuất khi token hết hạn/không hợp lệ. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);

  const isApiRequest = req.url.startsWith(environment.apiBaseUrl);
  const token = isApiRequest ? tokenStorage.getToken() : null;

  const authorizedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      const isPublicAuthEndpoint = PUBLIC_AUTH_PATHS.some((path) => req.url.endsWith(path));
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        !isPublicAuthEndpoint
      ) {
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
