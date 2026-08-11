import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateSavingsGoalRequest,
  SavingsGoal,
  SavingsGoalWithProgress,
  UpdateSavingsGoalRequest,
} from './models/savings-goal.model';

@Injectable({ providedIn: 'root' })
export class SavingsGoalsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/savings-goals`;

  list(): Observable<SavingsGoalWithProgress[]> {
    return this.http.get<SavingsGoalWithProgress[]>(this.baseUrl);
  }

  create(request: CreateSavingsGoalRequest): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(this.baseUrl, request);
  }

  update(id: string, request: UpdateSavingsGoalRequest): Observable<SavingsGoal> {
    return this.http.patch<SavingsGoal>(`${this.baseUrl}/${id}`, request);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
