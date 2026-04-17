/**
 * FindCustomerByPhoneDTO
 * -----------------------
 * Multi-tenant safe lookup contract.
 */

export class FindCustomerByPhoneDto {
  businessId!: string;
  phone!: string;
}