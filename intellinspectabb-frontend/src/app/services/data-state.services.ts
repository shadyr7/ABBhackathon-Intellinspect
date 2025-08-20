import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataStateService {
  // Create a private BehaviorSubject to hold the upload result.
  // It's initialized with 'null'.
  private uploadResultSource = new BehaviorSubject<any>(null);

  // Create a public observable from the source so components can subscribe to it.
  public uploadResult$ = this.uploadResultSource.asObservable();
  private dateRangesSource = new BehaviorSubject<any>(null);
  public dateRanges$ = this.dateRangesSource.asObservable();
  constructor() { }

  // A method to update the stored upload result.
  setUploadResult(result: any) {
    this.uploadResultSource.next(result);
  }
  

  setDateRanges(ranges: any) {
    this.dateRangesSource.next(ranges);
}
}