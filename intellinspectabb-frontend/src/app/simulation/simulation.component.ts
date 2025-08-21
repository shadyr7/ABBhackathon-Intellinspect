import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { DataStateService } from '../services/data-state.services';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit, OnDestroy {
  private streamActive = false;
  simulationStarted = false;
  simulationComplete = false;
  dateRanges: any;
  
  livePredictions: any[] = [];
  totalPredictions = 0;
  passCount = 0;
  failCount = 0;
  avgConfidence = 0;
  private confidenceSum = 0;

  constructor(
    private dataStateService: DataStateService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.dataStateService.dateRanges$.pipe(take(1)).subscribe(dateData => {
      if (dateData) {
        this.dateRanges = dateData;
      } else {
        this.router.navigate(['/date-ranges']);
      }
    });
  }

  startSimulation(): void {
    if (this.streamActive) return;

    // Reset all stats for a new run
    this.simulationStarted = true;
    this.simulationComplete = false;
    this.streamActive = true;
    this.livePredictions = [];
    this.totalPredictions = 0;
    this.passCount = 0;
    this.failCount = 0;
    this.avgConfidence = 0;
    this.confidenceSum = 0;
    
    const payload = {
      simulationStart: this.dateRanges.simulationStart,
      simulationEnd: this.dateRanges.simulationEnd
    };

    fetch('/api/Simulation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("Failed to get reader from response body");
        }
        const decoder = new TextDecoder();
        let buffer = '';

        const processText = ({ done, value }: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
            if (done || !this.streamActive) {
                this.streamActive = false;
                if (!this.simulationComplete) { // Mark as complete if not already done by a 'complete' message
                    this.simulationComplete = true;
                    this.cdr.detectChanges();
                }
                return Promise.resolve();
            }
            
            buffer += decoder.decode(value, { stream: true });
            
            let boundary = buffer.indexOf('\n\n');
            while (boundary !== -1) {
                const message = buffer.substring(0, boundary);
                buffer = buffer.substring(boundary + 2);

                if (message.startsWith('data:')) {
                    try {
                        const jsonStr = message.substring(5).trim();
                        if (jsonStr) {
                            const data = JSON.parse(jsonStr);

                            if (data.status === 'complete') {
                                this.simulationComplete = true;
                                this.streamActive = false; // Stop the loop
                                break; // Exit the while loop
                            }
                            if (data.error) {
                                console.error("Error from stream:", data.error);
                                this.simulationComplete = true;
                                this.streamActive = false;
                                break;
                            }

                            this.totalPredictions++;
                            this.confidenceSum += data.confidence;
                            this.avgConfidence = this.confidenceSum / this.totalPredictions;
                            data.prediction === 'Pass' ? this.passCount++ : this.failCount++;
                            
                            this.livePredictions.unshift(data);
                            if (this.livePredictions.length > 100) this.livePredictions.pop();
                        }
                    } catch(e) {
                      console.error("Failed to parse stream JSON:", message, e);
                    }
                }
                boundary = buffer.indexOf('\n\n');
            }
            
            this.cdr.detectChanges(); // Update the view with processed data
            if (this.streamActive) {
                return reader.read().then(processText);
            }
            return Promise.resolve();
        };
        return reader.read().then(processText);
    }).catch(error => {
        console.error('Simulation stream failed:', error);
        this.streamActive = false;
        this.simulationStarted = false; // Allow user to try again
        this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    // This will stop the fetch processing loop if the user navigates away
    this.streamActive = false;
  }
}