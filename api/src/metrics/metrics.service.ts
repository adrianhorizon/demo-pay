import { Injectable } from '@nestjs/common';
import { Registry, Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly register: Registry;

  readonly transferRequestsTotal: Counter<string>;
  readonly transferLatencySeconds: Histogram<string>;
  readonly txhashConfirmationsTotal: Counter<string>;
  readonly vendorRequestsTotal: Counter<string>;

  constructor() {
    this.register = new Registry();
    this.transferRequestsTotal = new Counter({
      name: 'payments_transfer_requests_total',
      help: 'Total transfer requests',
      labelNames: ['vendor', 'txhash_status'],
      registers: [this.register],
    });
    this.transferLatencySeconds = new Histogram({
      name: 'payments_transfer_latency_seconds',
      help: 'Transfer request latency in seconds',
      labelNames: ['vendor'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.register],
    });
    this.txhashConfirmationsTotal = new Counter({
      name: 'payments_txhash_confirmations_total',
      help: 'Txhash verification results',
      labelNames: ['status'],
      registers: [this.register],
    });
    this.vendorRequestsTotal = new Counter({
      name: 'payments_vendor_requests_total',
      help: 'Requests per vendor (success/failure)',
      labelNames: ['vendor', 'result'],
      registers: [this.register],
    });
  }

  getContentType(): string {
    return this.register.contentType;
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
