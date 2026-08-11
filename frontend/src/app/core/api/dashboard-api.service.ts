import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DashboardSummary } from './models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/dashboard`;

  getSummary(month: string): Observable<DashboardSummary> {
    const params = new HttpParams().set('month', month);
    return this.http.get<DashboardSummary>(`${this.baseUrl}/summary`, { params });
  }
}
