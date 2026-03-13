import { Injectable } from '@nestjs/common';
import { IVendorAdapter } from './interfaces/vendor.interface';

@Injectable()
export class VendorRegistryService {
  private readonly vendors = new Map<string, IVendorAdapter>();

  register(adapter: IVendorAdapter): void {
    this.vendors.set(adapter.name, adapter);
  }

  get(vendorId: string): IVendorAdapter | undefined {
    return this.vendors.get(vendorId);
  }

  has(vendorId: string): boolean {
    return this.vendors.has(vendorId);
  }

  listVendors(): string[] {
    return Array.from(this.vendors.keys());
  }
}
