import { Test, TestingModule } from '@nestjs/testing';
import { VendorBAdapter } from './vendor-b.adapter';

describe('VendorBAdapter', () => {
  let adapter: VendorBAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorBAdapter],
    }).compile();
    adapter = module.get(VendorBAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('has name vendorB', () => {
    expect(adapter.name).toBe('vendorB');
  });

  it('executeTransfer returns { status: "pending" }', async () => {
    const result = await adapter.executeTransfer(50, '0xabc');
    expect(result).toEqual({ status: 'pending' });
  });
});
