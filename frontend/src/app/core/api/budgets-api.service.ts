import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  BudgetWithUsage,
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from './models/budget.model';

@Injectable({ providedIn: 'root' })
export class BudgetsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/budgets`;

  list(month: string): Observable<BudgetWithUsage[]> {
    const params = new HttpParams().set('month', month);
    return this.http.get<BudgetWithUsage[]>(this.baseUrl, { params });
  }

  create(request: CreateBudgetRequest): Observable<Budget> {
    return this.http.post<Budget>(this.baseUrl, request);
  }

  update(id: string, request: UpdateBudgetRequest): Observable<Budget> {
    return this.http.patch<Budget>(`${this.baseUrl}/${id}`, request);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
