import { Injectable } from '@nestjs/common';
import { IVendorAdapter, VendorResponse } from '../interfaces/vendor.interface';

@Injectable()
export class VendorAAdapter implements IVendorAdapter {
  readonly name = 'vendorA';

  async executeTransfer(_amount: number, _txhash: string): Promise<VendorResponse> {
    return { status: 'success' };
  }
}
