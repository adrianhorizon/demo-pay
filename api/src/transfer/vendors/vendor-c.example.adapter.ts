import { Injectable } from '@nestjs/common';
import { IVendorAdapter, VendorResponse } from '../interfaces/vendor.interface';

@Injectable()
export class VendorCAdapter implements IVendorAdapter {
  readonly name = 'vendorC';

  async executeTransfer(_amount: number, _txhash: string): Promise<VendorResponse> {
    return { status: 'processing', estimatedCompletion: '2h' };
  }
}
