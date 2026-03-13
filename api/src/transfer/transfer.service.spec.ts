import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { VendorRegistryService } from './vendor-registry.service';
import { MetricsService } from '../metrics/metrics.service';
import { VendorAAdapter } from './vendors/vendor-a.adapter';
import { VendorBAdapter } from './vendors/vendor-b.adapter';

const mockMetrics = {
  transferRequestsTotal: { inc: jest.fn() },
  transferLatencySeconds: { observe: jest.fn() },
  txhashConfirmationsTotal: { inc: jest.fn() },
  vendorRequestsTotal: { inc: jest.fn() },
};

describe('TransferService', () => {
  let service: TransferService;
  let blockchain: BlockchainService;
  let registry: VendorRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        BlockchainService,
        VendorRegistryService,
        { provide: MetricsService, useValue: mockMetrics },
        VendorAAdapter,
        VendorBAdapter,
      ],
    }).compile();

    service = module.get(TransferService);
    blockchain = module.get(BlockchainService);
    registry = module.get(VendorRegistryService);
    registry.register(module.get(VendorAAdapter));
    registry.register(module.get(VendorBAdapter));
    jest.clearAllMocks();
  });

  it('returns not found when txhash is invalid', async () => {
    const result = await service.transfer({
      amount: 100,
      vendor: 'vendorA',
      txhash: 'invalid',
    });
    expect(result.txhashStatus).toBe('not found');
    expect(result.error).toBeDefined();
    expect(mockMetrics.txhashConfirmationsTotal.inc).toHaveBeenCalledWith({ status: 'not found' });
  });

  it('returns confirmed and vendor response when txhash is valid (vendorA)', async () => {
    const result = await service.transfer({
      amount: 100,
      vendor: 'vendorA',
      txhash: '0x1234567890abcdef',
    });
    expect(result.txhashStatus).toBe('confirmed');
    expect(result.vendorResponse).toEqual({ status: 'success' });
    expect(mockMetrics.txhashConfirmationsTotal.inc).toHaveBeenCalledWith({ status: 'confirmed' });
  });

  it('returns confirmed and pending when using vendorB', async () => {
    const result = await service.transfer({
      amount: 50,
      vendor: 'vendorB',
      txhash: '0xabcdef1234567890',
    });
    expect(result.txhashStatus).toBe('confirmed');
    expect(result.vendorResponse).toEqual({ status: 'pending' });
  });

  it('throws for unknown vendor', async () => {
    await expect(
      service.transfer({
        amount: 100,
        vendor: 'unknownVendor',
        txhash: '0x1234567890',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
