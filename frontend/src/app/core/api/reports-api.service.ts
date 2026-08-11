import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MonthlyReport, YearlyReport } from './models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/reports`;

  getMonthly(month: string): Observable<MonthlyReport> {
    const params = new HttpParams().set('month', month);
    return this.http.get<MonthlyReport>(`${this.baseUrl}/monthly`, { params });
  }

  getYearly(year: string): Observable<YearlyReport> {
    const params = new HttpParams().set('year', year);
    return this.http.get<YearlyReport>(`${this.baseUrl}/yearly`, { params });
  }

  /** URL tải file CSV (server set Content-Disposition: attachment) - dùng trực tiếp làm href, không cần fetch. */
  exportCsvUrl(month: string): string {
    return `${this.baseUrl}/export/csv?month=${encodeURIComponent(month)}`;
  }
}
