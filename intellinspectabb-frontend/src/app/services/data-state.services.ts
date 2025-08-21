import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataStateService {
  // Holds the metadata from the initial file upload
  private uploadResultSource = new BehaviorSubject<any>(null);
  public uploadResult$ = this.uploadResultSource.asObservable();

  // Holds the date ranges selected on screen 2
  private dateRangesSource = new BehaviorSubject<any>(null);
  public dateRanges$ = this.dateRangesSource.asObservable();

  constructor() { }

  // Called from UploadComponent to store the file metadata
  setUploadResult(result: any) {
    this.uploadResultSource.next(result);
  }

  // Called from DateRangesComponent to store the selected dates
  setDateRanges(ranges: any) {
    this.dateRangesSource.next(ranges);
  }
}