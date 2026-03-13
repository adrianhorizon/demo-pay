import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { TransferRequestDto } from './dto/transfer-request.dto';
import { TransferService, TransferResult } from './transfer.service';

@Controller()
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post('transfer')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async transfer(@Body() dto: TransferRequestDto): Promise<TransferResult> {
    return this.transferService.transfer(dto);
  }
}
