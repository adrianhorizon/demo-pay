import { Injectable } from '@nestjs/common';

export type TxHashStatus = 'confirmed' | 'not found';

@Injectable()
export class BlockchainService {
  async verifyTxHash(txhash: string): Promise<TxHashStatus> {
    const trimmed = txhash?.trim() ?? '';
    if (trimmed.startsWith('0x') && trimmed.length >= 10) {
      return 'confirmed';
    }
    return 'not found';
  }
}
