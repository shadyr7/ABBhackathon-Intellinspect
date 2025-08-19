import { Component } from '@angular/core';
// We need to import NgIf, DecimalPipe, DatePipe, and PercentPipe from @angular/common
import { CommonModule, DatePipe, DecimalPipe, NgIf, PercentPipe } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-upload-dataset',
  standalone: true,
  // We list the specific pipes and directives we use in the template here
  imports: [CommonModule, NgIf, DecimalPipe, DatePipe, PercentPipe], 
  templateUrl: './upload-dataset.component.html',
  styleUrls: ['./upload-dataset.component.scss'],
  // We also need to provide the pipes
  providers: [DecimalPipe, DatePipe, PercentPipe]
})
export class UploadDatasetComponent {
  
  isLoading = false;
  uploadResult: any = null;
  errorMessage: string | null = null;
  selectedFileName: string | null = null;

  constructor(private apiService: ApiService) {}

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

  // Method to go back to the initial state
  reset(): void {
    this.isLoading = false;
    this.uploadResult = null;
    this.errorMessage = null;
    this.selectedFileName = null;
  }
}