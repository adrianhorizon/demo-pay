import { IsNumber, IsString, Min } from 'class-validator';

export class TransferRequestDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  vendor: string;

  @IsString()
  txhash: string;
}
