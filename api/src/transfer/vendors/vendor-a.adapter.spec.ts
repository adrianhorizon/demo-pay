import { Test, TestingModule } from '@nestjs/testing';
import { VendorAAdapter } from './vendor-a.adapter';

describe('VendorAAdapter', () => {
  let adapter: VendorAAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorAAdapter],
    }).compile();
    adapter = module.get(VendorAAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('has name vendorA', () => {
    expect(adapter.name).toBe('vendorA');
  });

  it('executeTransfer returns { status: "success" }', async () => {
    const result = await adapter.executeTransfer(100, '0x123');
    expect(result).toEqual({ status: 'success' });
  });
});
