import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadDatasetComponent } from './upload-dataset.component'; // Use the correct class name

describe('UploadDatasetComponent', () => { // Use the correct class name
  let component: UploadDatasetComponent;
  let fixture: ComponentFixture<UploadDatasetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadDatasetComponent] // Use the correct class name
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadDatasetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});