import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post('/api/Upload', formData); 
  }

  validateDateRanges(payload: any): Observable<any> {
    return this.http.post('/api/DateRanges/validate', payload);
  }

  trainModel(payload: any): Observable<any> {
    return this.http.post('/api/DateRanges/train-model', payload);
  }
}