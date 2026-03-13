import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from './blockchain.service';

describe('BlockchainService', () => {
  let service: BlockchainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainService],
    }).compile();
    service = module.get(BlockchainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyTxHash', () => {
    it('returns "confirmed" when txhash starts with 0x and has length >= 10', async () => {
      await expect(service.verifyTxHash('0x1234567890')).resolves.toBe('confirmed');
      await expect(service.verifyTxHash('0xabcdef1234567890')).resolves.toBe('confirmed');
      await expect(service.verifyTxHash('0x1234567890abcdef')).resolves.toBe('confirmed');
    });

    it('returns "not found" when txhash does not start with 0x', async () => {
      await expect(service.verifyTxHash('1234567890')).resolves.toBe('not found');
      await expect(service.verifyTxHash('abc')).resolves.toBe('not found');
    });

    it('returns "not found" when txhash is too short', async () => {
      await expect(service.verifyTxHash('0x123')).resolves.toBe('not found');
      await expect(service.verifyTxHash('0x1234567')).resolves.toBe('not found');
    });

    it('returns "confirmed" when txhash has leading/trailing spaces and is valid', async () => {
      await expect(service.verifyTxHash('  0x1234567890  ')).resolves.toBe('confirmed');
    });

    it('returns "not found" for empty or null-ish input', async () => {
      await expect(service.verifyTxHash('')).resolves.toBe('not found');
      await expect(service.verifyTxHash('   ')).resolves.toBe('not found');
    });
  });
});
