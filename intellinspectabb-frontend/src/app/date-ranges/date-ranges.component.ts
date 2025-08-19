import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { take } from 'rxjs';
import { ApiService } from '../services/api.service';
import { DataStateService } from '../services/data-state.services';

@Component({
  selector: 'app-date-ranges',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxChartsModule
  ],
  templateUrl: './date-ranges.component.html',
  styleUrls: ['./date-ranges.component.scss']
})
export class DateRangesComponent implements OnInit {

  isLoading = false;
  validationResult: any = null;
  errorMessage: string | null = null;
  earliestTimestamp: string | null = null;
  latestTimestamp: string | null = null;

  // Bound to <input type="date">
  trainingStart: string = '';
  trainingEnd: string = '';
  testingStart: string = '';
  testingEnd: string = '';
  simulationStart: string = '';
  simulationEnd: string = '';

  // Chart variables
  chartData: any[] = [];
  view: [number, number] = [850, 300];
  showXAxis = true;
  showYAxis = true;
  showXAxisLabel = true;
  xAxisLabel = 'Month';
  showYAxisLabel = true;
  yAxisLabel = 'Record Count';

  // Custom colors for bars
  customColors: any[] = [];

  constructor(
    private dataStateService: DataStateService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.dataStateService.uploadResult$.pipe(take(1)).subscribe(result => {
      if (result && result.earliestTimestamp) {
        this.earliestTimestamp = new Date(result.earliestTimestamp).toISOString().split('T')[0];
        this.latestTimestamp = new Date(result.latestTimestamp).toISOString().split('T')[0];
      } else {
        this.router.navigate(['/upload']);
      }
    });
  }

  validateRanges(): void {
    this.isLoading = true;
    this.validationResult = null;
    this.errorMessage = null;

    // ✅ Ensure all six fields are filled
    if (!this.trainingStart || !this.trainingEnd ||
        !this.testingStart || !this.testingEnd ||
        !this.simulationStart || !this.simulationEnd) {
      this.isLoading = false;
      this.errorMessage = "All six date fields must be selected.";
      return;
    }

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
        this.prepareChartData();
        console.log('Validation successful!', response);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'An unknown error occurred.';
        console.error('Validation failed:', err);
      }
    });
  }
 
 prepareChartData(): void {
      console.log('Monthly record counts:', this.validationResult?.monthlyRecordCounts);
    const monthlyData = this.validationResult?.monthlyRecordCounts || {};
    const sortedKeys = Object.keys(monthlyData).sort();

    this.chartData = sortedKeys.map(key => ({
      name: key,
      value: monthlyData[key]
    }));

    // Assign colors dynamically
    this.customColors = this.chartData.map(dataPoint => {
      const monthDateStr = dataPoint.name + '-01'; // assumes YYYY-MM format keys

      if (this.isDateInRange(monthDateStr, this.trainingStart, this.trainingEnd)) {
        return { name: dataPoint.name, value: '#28a745' }; // Green for Training
      } else if (this.isDateInRange(monthDateStr, this.testingStart, this.testingEnd)) {
        return { name: dataPoint.name, value: '#ffc107' }; // Orange for Testing
      } else if (this.isDateInRange(monthDateStr, this.simulationStart, this.simulationEnd)) {
        return { name: dataPoint.name, value: '#007bff' }; // Blue for Simulation
      } else {
        return { name: dataPoint.name, value: '#cccccc' }; // Gray if not in range
      }
    });
  }


  // Helper function for coloring the chart bars
  isDateInRange(dateStr: string, startStr: string, endStr: string): boolean {
    const date = new Date(dateStr);
    const start = new Date(startStr);
    const end = new Date(endStr);
    return date >= start && date <= end;
  }

  // For handling bar clicks
  onSelect(event: any) {
    console.log('Bar clicked:', event);
  }
}
