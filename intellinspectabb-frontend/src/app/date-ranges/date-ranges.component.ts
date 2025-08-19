import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { ApiService } from '../services/api.service'; // <-- Import ApiService
import { DataStateService } from '../services/data-state.services';

@Component({
  selector: 'app-date-ranges',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-ranges.component.html',
  styleUrls: ['./date-ranges.component.scss']
})
export class DateRangesComponent implements OnInit {
  
  earliestTimestamp: string | null = null;
  latestTimestamp: string | null = null;
  
  trainingStart: string = '';
  trainingEnd: string = '';
  testingStart: string = '';
  testingEnd: string = '';
  simulationStart: string = '';
  simulationEnd: string = '';

  // Variables to hold the validation result
  validationResult: any = null;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private dataStateService: DataStateService,
    private apiService: ApiService, // <-- Inject ApiService
    private router: Router
  ) {}

  ngOnInit(): void {
    this.dataStateService.uploadResult$.pipe(take(1)).subscribe(result => {
      if (result) {
        this.earliestTimestamp = new Date(result.earliestTimestamp).toISOString().split('T')[0];
        this.latestTimestamp = new Date(result.latestTimestamp).toISOString().split('T')[0];
      } else {
        this.router.navigate(['/upload']);
      }
    });
  }
  
  validateRanges(): void {
    // Reset previous results
    this.isLoading = true;
    this.validationResult = null;
    this.errorMessage = null;

    const payload = {
      trainingStart: this.trainingStart,
      trainingEnd: this.trainingEnd,
      testingStart: this.testingStart,
      testingEnd: this.testingEnd,
      simulationStart: this.simulationStart,
      simulationEnd: this.simulationEnd
    };

    this.apiService.validateDateRanges(payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.validationResult = response;
        console.log('Validation successful!', response);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'An unknown error occurred.';
        console.error('Validation failed:', err);
      }
    });
  }
}