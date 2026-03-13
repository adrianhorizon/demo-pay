import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { MetricsModule } from '../metrics/metrics.module';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { VendorRegistryService } from './vendor-registry.service';
import { VendorRegistrationService } from './vendor-registration.service';
import { VendorAAdapter } from './vendors/vendor-a.adapter';
import { VendorBAdapter } from './vendors/vendor-b.adapter';

@Module({
  imports: [BlockchainModule, MetricsModule],
  controllers: [TransferController],
  providers: [
    TransferService,
    VendorRegistryService,
    VendorRegistrationService,
    VendorAAdapter,
    VendorBAdapter,
  ],
})
export class TransferModule {}
