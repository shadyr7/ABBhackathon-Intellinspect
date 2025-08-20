import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'; // <-- 1. Import Sanitizer
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { ApiService } from '../services/api.service';
import { DataStateService } from '../services/data-state.services';

@Component({
  selector: 'app-model-training',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './model-training.component.html',
  styleUrls: ['./model-training.component.scss']
})
export class ModelTrainingComponent implements OnInit {
  dateRanges: any = null;
  isLoading = false;
  trainingResult: any = null;
  errorMessage: string | null = null;

  constructor(
    private dataStateService: DataStateService,
    private apiService: ApiService,
    private router: Router,
    private sanitizer: DomSanitizer // <-- 2. Inject Sanitizer
  ) {}

  ngOnInit(): void {
    this.dataStateService.dateRanges$.pipe(take(1)).subscribe(ranges => {
      if (ranges) {
        this.dateRanges = ranges;
      } else {
        this.router.navigate(['/date-ranges']);
      }
    });
  }

  trainModel(): void {
    this.isLoading = true;
    this.trainingResult = null;
    this.errorMessage = null;

    const payload = {
      trainStart: this.dateRanges.trainingStart,
      trainEnd: this.dateRanges.trainingEnd,
      testStart: this.dateRanges.testingStart,
      testEnd: this.dateRanges.testingEnd
    };

    this.apiService.trainModel(payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.trainingResult = response;
        console.log('Model training successful!', response);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'An error occurred during model training.';
        console.error('Model training failed:', err);
      }
    });
  }
  
  // --- 3. ADD THIS METHOD ---
  // This method is required to tell Angular that our base64 image string is safe to display
  getSanitizedUrl(base64Image: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl('data:image/png;base64,' + base64Image);
  }
}