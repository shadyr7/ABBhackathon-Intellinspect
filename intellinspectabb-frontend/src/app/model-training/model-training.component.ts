import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
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
    private router: Router,
    private apiService: ApiService,
    private sanitizer: DomSanitizer,
    private dataStateService: DataStateService
  ) {}

  ngOnInit(): void {
    // Get the data from the service
    this.dataStateService.dateRanges$.pipe(take(1)).subscribe(dateData => {
      console.log('SCREEN 3: Received these ranges from the service:', dateData);

      if (dateData && dateData.trainingStart) {
        this.dateRanges = dateData;
      } else {
        // If the service has no data, go back
        this.router.navigate(['/date-ranges']);
      }
    });
  }

  trainModel(): void {
    if (!this.dateRanges) {
      this.errorMessage = "Date ranges are not defined. Please go back.";
      return;
    }

    this.isLoading = true;
    this.trainingResult = null;
    this.errorMessage = null;

    // --- FIXED PAYLOAD FOR BACKEND ---
    const payload = {
      TrainingStart: this.dateRanges.trainingStart,
      TrainingEnd: this.dateRanges.trainingEnd,
      TestingStart: this.dateRanges.testingStart,
      TestingEnd: this.dateRanges.testingEnd
    };
    // --- END FIX ---

    console.log('SCREEN 3: Sending this CORRECTED payload to the backend:', payload);

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

  getSanitizedUrl(base64Image: string): SafeUrl {
    if (!base64Image) return '';
    return this.sanitizer.bypassSecurityTrustUrl('data:image/png;base64,' + base64Image);
  }

  // --- NAVIGATION METHOD ---
  goToNext(): void {
    // The simulation screen will get the date ranges from DataStateService
    this.router.navigate(['/simulation']);
  }
}
