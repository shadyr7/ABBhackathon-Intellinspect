import { CommonModule, DatePipe, DecimalPipe, NgIf, PercentPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router'; // <-- The missing import is here
import { ApiService } from '../services/api.service';
import { DataStateService } from '../services/data-state.services';

@Component({
  selector: 'app-upload-dataset',
  standalone: true,
  imports: [CommonModule, NgIf, DecimalPipe, DatePipe, PercentPipe], 
  templateUrl: './upload-dataset.component.html',
  styleUrls: ['./upload-dataset.component.scss'],
  providers: [DecimalPipe, DatePipe, PercentPipe]
})
export class UploadDatasetComponent {
  
  isLoading = false;
  uploadResult: any = null;
  errorMessage: string | null = null;
  selectedFileName: string | null = null;

  constructor(
    private apiService: ApiService, 
    private router: Router, 
    private dataStateService: DataStateService
  ) {}

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    if (file) {
      this.isLoading = true;
      this.uploadResult = null;
      this.errorMessage = null;
      this.selectedFileName = file.name;

      console.log(`Uploading file: ${this.selectedFileName}...`);

      this.apiService.uploadFile(file).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.uploadResult = response;
          console.log('Upload successful!', response);
        },
        error: (err: any) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'An unknown error occurred during upload.';
          console.error('Upload failed:', err);
        }
      });
    }
  }

  goToNext(): void {
    // Store the result in the service BEFORE navigating
    this.dataStateService.setUploadResult(this.uploadResult);
    this.router.navigate(['/date-ranges']);
  }

  reset(): void {
    this.isLoading = false;
    this.uploadResult = null;
    this.errorMessage = null;
    this.selectedFileName = null;
  }
}