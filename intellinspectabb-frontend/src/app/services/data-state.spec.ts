import { TestBed } from '@angular/core/testing';

import { DataStateService } from './data-state.services';

describe('DataState', () => {
  let service: DataStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
