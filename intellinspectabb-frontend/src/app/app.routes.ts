import { Routes } from '@angular/router';
import { DateRangesComponent } from './date-ranges/date-ranges.component'; // Make sure this import exists
import { ModelTrainingComponent } from './model-training/model-training.component';
import { UploadDatasetComponent } from './upload-dataset/upload-dataset.component';

export const routes: Routes = [
  { path: '', redirectTo: 'upload', pathMatch: 'full' },
  { path: 'upload', component: UploadDatasetComponent },

  // THIS IS THE CRITICAL LINE THAT THE ROUTER CAN'T FIND
  { path: 'date-ranges', component: DateRangesComponent },
  { path: 'model-training', component: ModelTrainingComponent }, 
];