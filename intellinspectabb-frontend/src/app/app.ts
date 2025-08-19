import { Component } from '@angular/core';
// Removed RouterOutlet since we are not using it right now
import { UploadDatasetComponent } from './upload-dataset/upload-dataset.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UploadDatasetComponent], // <-- Removed RouterOutlet from here
  template: `
    <app-upload-dataset></app-upload-dataset>
  `,
  styleUrl: './app.scss' // <-- CORRECTED the filename here
})
export class AppComponent { // <-- Note the class name is AppComponent
}
