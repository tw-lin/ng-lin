import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ALLOW_ANONYMOUS } from '@delon/auth';

import { CWA_API_CONFIG } from '../config';
import { WeatherApiService } from './weather-api.service';

describe('WeatherApiService', () => {
  let service: WeatherApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(WeatherApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should use anonymous context and avoid auth headers while keeping query params', () => {
    service.getCityForecast('臺中市').subscribe();

    const req = httpMock.expectOne(request => request.url.includes(CWA_API_CONFIG.datasets.cityForecast));

    expect(req.request.context.get(ALLOW_ANONYMOUS)).toBeTrue();
    expect(req.request.headers.has('Authorization')).toBeFalse();
    expect(req.request.headers.has('token')).toBeFalse();
    expect(req.request.params.get('Authorization')).toBe(CWA_API_CONFIG.apiKey);
    expect(req.request.params.get('locationName')).toBe('臺中市');

    req.flush({ records: { location: [] } });
  });
});
