import { Test, TestingModule } from '@nestjs/testing';
import { VendorRegistryService } from './vendor-registry.service';
import { IVendorAdapter } from './interfaces/vendor.interface';

describe('VendorRegistryService', () => {
  let service: VendorRegistryService;

  const mockAdapter: IVendorAdapter = {
    name: 'mockVendor',
    executeTransfer: jest.fn().mockResolvedValue({ status: 'ok' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorRegistryService],
    }).compile();
    service = module.get(VendorRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register and get', () => {
    it('registers and returns adapter by id', () => {
      expect(service.has('mockVendor')).toBe(false);
      service.register(mockAdapter);
      expect(service.get('mockVendor')).toBe(mockAdapter);
      expect(service.has('mockVendor')).toBe(true);
    });

    it('returns undefined for unregistered vendor', () => {
      expect(service.get('nonexistent')).toBeUndefined();
      expect(service.has('nonexistent')).toBe(false);
    });
  });

  describe('listVendors', () => {
    it('returns empty array when no vendors registered', () => {
      expect(service.listVendors()).toEqual([]);
    });

    it('returns all registered vendor names', () => {
      service.register(mockAdapter);
      const another = { ...mockAdapter, name: 'another' };
      service.register(another);
      expect(service.listVendors()).toContain('mockVendor');
      expect(service.listVendors()).toContain('another');
      expect(service.listVendors()).toHaveLength(2);
    });
  });
});
