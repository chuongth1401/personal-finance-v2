import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FinancialInsight } from './models/financial-insight.model';

@Injectable({ providedIn: 'root' })
export class FinancialAnalysisApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/financial-analysis`;

  /** Chạy phân tích cho một tháng (quy tắc thuần, không gọi AI) và lưu lại kết quả. */
  run(month: string): Observable<FinancialInsight[]> {
    const params = new HttpParams().set('month', month);
    return this.http.post<FinancialInsight[]>(`${this.baseUrl}/run`, null, { params });
  }

  /** Bỏ trống `month` để xem insight của mọi kỳ. */
  list(month?: string): Observable<FinancialInsight[]> {
    const params = month ? new HttpParams().set('month', month) : undefined;
    return this.http.get<FinancialInsight[]>(`${this.baseUrl}/insights`, { params });
  }

  markAsRead(id: string): Observable<FinancialInsight> {
    return this.http.patch<FinancialInsight>(`${this.baseUrl}/insights/${id}/read`, {});
  }

  hide(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/insights/${id}`);
  }
}
