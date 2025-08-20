import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelTrainingComponent } from './model-training.component';

describe('ModelTraining', () => {
  let component: ModelTrainingComponent;
  let fixture: ComponentFixture<ModelTrainingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelTrainingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
