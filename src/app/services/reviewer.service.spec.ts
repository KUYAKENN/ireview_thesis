import { TestBed } from '@angular/core/testing';

import { ReviewerService } from './reviewer.service';

describe('ReviewerService', () => {
  let service: ReviewerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReviewerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
