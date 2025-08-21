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
  imports: [CommonModule, FormsModule, NgxChartsModule],
  templateUrl: './date-ranges.component.html',
  styleUrls: ['./date-ranges.component.scss']
})
export class DateRangesComponent implements OnInit {
  
  isLoading = false;
  validationResult: any = null;
  errorMessage: string | null = null;
  earliestTimestamp: string | null = null;
  latestTimestamp: string | null = null;
  trainingStart: string = '';
  trainingEnd: string = '';
  testingStart: string = '';
  testingEnd: string = '';
  simulationStart: string = '';
  simulationEnd: string = '';

  chartData: any[] = [];
  monthlyCounts: any = null;
  view: [number, number] = [850, 300];
  showXAxis = true;
  showYAxis = true;
  showXAxisLabel = true;
  xAxisLabel = 'Month';
  showYAxisLabel = true;
  yAxisLabel = 'Record Count';
  customColors: any[] = [];
  
  constructor(
    private dataStateService: DataStateService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.dataStateService.uploadResult$.pipe(take(1)).subscribe((result: any) => {
      if (result && result.earliestTimestamp) {
        this.earliestTimestamp = new Date(result.earliestTimestamp).toISOString().split('T')[0];
        this.latestTimestamp = new Date(result.latestTimestamp).toISOString().split('T')[0];
        this.monthlyCounts = result.monthlyRecordCounts;
      } else {
        this.router.navigate(['/upload']);
      }
    });
  }
  
  validateRanges(): void {
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
        this.prepareChartData();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'An unknown validation error occurred.';
      }
    });
  }

  prepareChartData(): void {
    const monthlyData = this.monthlyCounts || {};
    const sortedKeys = Object.keys(monthlyData).sort();

    this.chartData = sortedKeys.map(key => ({
      name: key,
      value: monthlyData[key]
    }));
    
    this.customColors = this.chartData.map(dataPoint => {
        const monthDateStr = dataPoint.name + '-01';
        if (this.isDateInRange(monthDateStr, this.trainingStart, this.trainingEnd)) {
            return { name: dataPoint.name, value: '#28a745' };
        } else if (this.isDateInRange(monthDateStr, this.testingStart, this.testingEnd)) {
            return { name: dataPoint.name, value: '#ffc107' };
        } else if (this.isDateInRange(monthDateStr, this.simulationStart, this.simulationEnd)) {
            return { name: dataPoint.name, value: '#007bff' };
        } else {
            return { name: dataPoint.name, value: '#cccccc' };
        }
    });
  }

  isDateInRange(dateStr: string, startStr: string, endStr: string): boolean {
    if (!startStr || !endStr) return false;
    const date = new Date(dateStr);
    const start = new Date(startStr);
    const end = new Date(endStr);
    return date >= start && date <= end;
  }

  goToNext(): void {
    const datePayload = {
      trainingStart: this.trainingStart,
      trainingEnd: this.trainingEnd,
      testingStart: this.testingStart,
      testingEnd: this.testingEnd,
      simulationStart: this.simulationStart,
      simulationEnd: this.simulationEnd
    };
    // Use the service to store the data
    console.log('SCREEN 2: Storing these dates in the service:', datePayload);

    this.dataStateService.setDateRanges(datePayload);
    this.router.navigate(['/model-training']);
  }

  onSelect(event: any): void {
    console.log('Chart bar clicked', event);
  }
}