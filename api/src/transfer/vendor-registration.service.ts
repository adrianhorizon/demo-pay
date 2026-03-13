import { Injectable, OnModuleInit } from '@nestjs/common';
import { IVendorAdapter } from './interfaces/vendor.interface';
import { VendorRegistryService } from './vendor-registry.service';
import { VendorAAdapter } from './vendors/vendor-a.adapter';
import { VendorBAdapter } from './vendors/vendor-b.adapter';

@Injectable()
export class VendorRegistrationService implements OnModuleInit {
  constructor(
    private readonly registry: VendorRegistryService,
    private readonly vendorA: VendorAAdapter,
    private readonly vendorB: VendorBAdapter,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.vendorA);
    this.registry.register(this.vendorB);
  }
}
