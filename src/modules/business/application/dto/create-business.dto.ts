export class CreateBusinessDto {
  name!: string;

  phone!: string;

  email!: string;

  address?: string;

  logoUrl?: string;

  timezone!: string;

  currency!: string;

  operatingHours?: {
    open: string;
    close: string;
  };

  subscriptionPlan?: string;
}