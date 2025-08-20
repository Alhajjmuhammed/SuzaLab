import { TestBed } from '@angular/core/testing';

import { CompService } from './comp-service';

describe('CompService', () => {
  let service: CompService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
