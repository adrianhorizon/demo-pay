import { BadRequestException, Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { MetricsService } from '../metrics/metrics.service';
import { VendorRegistryService } from './vendor-registry.service';
import { TransferRequestDto } from './dto/transfer-request.dto';
import { VendorResponse } from './interfaces/vendor.interface';

export interface TransferResult {
  txhashStatus: 'confirmed' | 'not found';
  vendorResponse?: VendorResponse;
  error?: string;
}

@Injectable()
export class TransferService {
  constructor(
    private readonly blockchain: BlockchainService,
    private readonly vendorRegistry: VendorRegistryService,
    private readonly metrics: MetricsService,
  ) {}

  async transfer(dto: TransferRequestDto): Promise<TransferResult> {
    const start = Date.now();
    const txhashStatus = await this.blockchain.verifyTxHash(dto.txhash);
    this.metrics.txhashConfirmationsTotal.inc({ status: txhashStatus });

    if (txhashStatus === 'not found') {
      this.metrics.transferRequestsTotal.inc({ vendor: dto.vendor, txhash_status: 'not_found' });
      this.metrics.transferLatencySeconds.observe({ vendor: dto.vendor }, (Date.now() - start) / 1000);
      return { txhashStatus: 'not found', error: 'Transaction not found or not confirmed' };
    }

    const vendor = this.vendorRegistry.get(dto.vendor);
    if (!vendor) {
      throw new BadRequestException(`Unknown vendor: ${dto.vendor}. Available: ${this.vendorRegistry.listVendors().join(', ')}`);
    }

    try {
      const vendorResponse = await vendor.executeTransfer(dto.amount, dto.txhash);
      this.metrics.transferRequestsTotal.inc({ vendor: dto.vendor, txhash_status: 'confirmed' });
      this.metrics.vendorRequestsTotal.inc({ vendor: dto.vendor, result: vendorResponse.status || 'success' });
      this.metrics.transferLatencySeconds.observe({ vendor: dto.vendor }, (Date.now() - start) / 1000);
      return { txhashStatus: 'confirmed', vendorResponse };
    } catch (err) {
      this.metrics.vendorRequestsTotal.inc({ vendor: dto.vendor, result: 'error' });
      this.metrics.transferLatencySeconds.observe({ vendor: dto.vendor }, (Date.now() - start) / 1000);
      throw err;
    }
  }
}
