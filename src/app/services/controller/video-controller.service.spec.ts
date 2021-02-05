import { TestBed } from '@angular/core/testing';

import { VideoControllerService } from './video-controller.service';

describe('VideoControllerService', () => {
  let service: VideoControllerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
