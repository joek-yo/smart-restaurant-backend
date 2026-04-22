export class Business {
  id?: string;

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

  isActive: boolean = true;

  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial?: Partial<Business>) {
    Object.assign(this, partial);
  }
}