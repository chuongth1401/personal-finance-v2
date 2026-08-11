import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../api/models/auth.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  private readonly currentUserSignal = signal<AuthUser | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, request)
      .pipe(tap((response) => this.applyAuthResponse(response)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, request)
      .pipe(tap((response) => this.applyAuthResponse(response)));
  }

  /**
   * Khôi phục phiên đăng nhập từ token đã lưu (gọi lúc khởi động app, xem
   * `provideAppInitializer` trong app.config.ts). Lỗi (token hết hạn/không hợp
   * lệ) được xử lý ở nơi gọi - chỉ cần dọn session, không cần điều hướng vì
   * route guard sẽ tự chuyển hướng khi cần.
   */
  restoreSession(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(`${this.baseUrl}/me`)
      .pipe(tap((user) => this.currentUserSignal.set(user)));
  }

  hasToken(): boolean {
    return this.tokenStorage.getToken() !== null;
  }

  clearSession(): void {
    this.tokenStorage.clearToken();
    this.currentUserSignal.set(null);
  }

  logout(): void {
    this.clearSession();
    // JWT access-token thuần là stateless phía server - gọi "cho có" để sẵn chỗ
    // mở rộng sau này (audit log/token blocklist), không cần chờ kết quả.
    this.http.post(`${this.baseUrl}/logout`, {}).subscribe({ error: () => undefined });
    void this.router.navigate(['/login']);
  }

  private applyAuthResponse(response: AuthResponse): void {
    this.tokenStorage.setToken(response.accessToken);
    this.currentUserSignal.set(response.user);
  }
}
