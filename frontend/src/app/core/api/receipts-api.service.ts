import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ConfirmReceiptRequest, Receipt } from './models/receipt.model';

@Injectable({ providedIn: 'root' })
export class ReceiptsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/receipts`;

  /** Không tự set Content-Type - HttpClient tự thêm multipart boundary đúng khi body là FormData. */
  upload(file: File): Observable<Receipt> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Receipt>(`${this.baseUrl}/upload`, formData);
  }

  confirm(id: string, request: ConfirmReceiptRequest): Observable<Receipt> {
    return this.http.post<Receipt>(`${this.baseUrl}/${id}/confirm`, request);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
