export interface VendorResponse {
  status: string;
  [key: string]: unknown;
}

export interface IVendorAdapter {
  readonly name: string;
  executeTransfer(amount: number, txhash: string): Promise<VendorResponse>;
}
