// src/domains/customers/customers.module.ts

import { Module } from '@nestjs/common';

import { CustomersController } from './customers.controller';

import { CustomerService } from './services/customer.service';
import { FindOrCreateCustomerUseCase } from './use-cases/find-or-create-customer.usecase';

// 🔥 IMPORT REPOSITORY MODULE
import { MongooseRepositoriesModule } from '../../infrastructure/database/mongoose/mongoose.repositories.module';

/**
 * CustomersModule
 * ----------------
 * Connects:
 * Controllers → UseCases → Services → Repositories
 */

@Module({
  imports: [
    // 🔥 THIS FIXES THE ERROR
    MongooseRepositoriesModule,
  ],

  controllers: [
    CustomersController,
  ],

  providers: [
    // -----------------------------
    // CORE DOMAIN SERVICE
    // -----------------------------
    CustomerService,

    // -----------------------------
    // APPLICATION USE CASE
    // -----------------------------
    FindOrCreateCustomerUseCase,
  ],

  exports: [
    CustomerService,
    FindOrCreateCustomerUseCase,
  ],
})
export class CustomersModule {}