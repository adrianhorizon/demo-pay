import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();
    service = module.get(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('exposes transferRequestsTotal counter', () => {
    expect(service.transferRequestsTotal).toBeDefined();
    expect(service.transferRequestsTotal.inc).toBeDefined();
  });

  it('exposes transferLatencySeconds histogram', () => {
    expect(service.transferLatencySeconds).toBeDefined();
    expect(service.transferLatencySeconds.observe).toBeDefined();
  });

  it('getMetrics returns a string (Prometheus format)', async () => {
    const metrics = await service.getMetrics();
    expect(typeof metrics).toBe('string');
    expect(metrics).toContain('payments_');
  });
});
