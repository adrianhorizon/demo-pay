import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';

describe('TransferController', () => {
  let controller: TransferController;
  let transferService: TransferService;

  const mockTransferService = {
    transfer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferController],
      providers: [
        {
          provide: TransferService,
          useValue: mockTransferService,
        },
      ],
    }).compile();

    controller = module.get(TransferController);
    transferService = module.get(TransferService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('transfer', () => {
    it('returns result from TransferService for valid request', async () => {
      const dto = { amount: 100, vendor: 'vendorA', txhash: '0x1234567890abcdef' };
      const expected = { txhashStatus: 'confirmed' as const, vendorResponse: { status: 'success' } };
      mockTransferService.transfer.mockResolvedValue(expected);

      const result = await controller.transfer(dto);
      expect(mockTransferService.transfer).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('returns not found result when service returns txhashStatus not found', async () => {
      const dto = { amount: 100, vendor: 'vendorA', txhash: 'invalid' };
      const expected = { txhashStatus: 'not found' as const, error: 'Transaction not found or not confirmed' };
      mockTransferService.transfer.mockResolvedValue(expected);

      const result = await controller.transfer(dto);
      expect(result).toEqual(expected);
    });

    it('propagates BadRequestException when vendor is unknown', async () => {
      const dto = { amount: 100, vendor: 'unknownVendor', txhash: '0x1234567890' };
      mockTransferService.transfer.mockRejectedValue(new BadRequestException('Unknown vendor'));

      await expect(controller.transfer(dto)).rejects.toThrow(BadRequestException);
    });
  });
});
