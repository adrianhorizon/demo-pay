import { Injectable } from '@nestjs/common';
import { IVendorAdapter, VendorResponse } from '../interfaces/vendor.interface';

@Injectable()
export class VendorBAdapter implements IVendorAdapter {
  readonly name = 'vendorB';

  async executeTransfer(_amount: number, _txhash: string): Promise<VendorResponse> {
    return { status: 'pending' };
  }
}
