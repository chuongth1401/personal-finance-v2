import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  inject,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideCharts(withDefaultRegisterables()),
    // Khôi phục phiên đăng nhập từ token đã lưu trước khi app render, để route
    // guard đọc đúng trạng thái isAuthenticated() ngay từ lần render đầu tiên.
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      if (!authService.hasToken()) return Promise.resolve();
      return firstValueFrom(authService.restoreSession()).then(
        () => undefined,
        () => authService.clearSession(),
      );
    }),
  ],
};
