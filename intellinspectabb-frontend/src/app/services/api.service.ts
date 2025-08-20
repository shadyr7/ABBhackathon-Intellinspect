import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5080/api/Upload';

  constructor(private http: HttpClient) { }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post(this.apiUrl, formData);

  }
  validateDateRanges(payload: any): Observable<any> {
    const validateUrl = 'http://localhost:5080/api/DateRanges/validate';
    return this.http.post(validateUrl, payload);
  }
   trainModel(payload: any): Observable<any> {
    // The URL for our new backend endpoint that we will create soon
    const trainUrl = 'http://localhost:5080/api/DateRanges/train-model';
    return this.http.post(trainUrl, payload);
  }
}

