// src/modules/customers/customers.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CustomerSchema } from './infrastructure/schemas/customer.schema';
import { BusinessCustomerSchema } from './infrastructure/schemas/business-customer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Customer', schema: CustomerSchema },
      { name: 'BusinessCustomer', schema: BusinessCustomerSchema },
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [MongooseModule],
})
export class CustomersModule {}
