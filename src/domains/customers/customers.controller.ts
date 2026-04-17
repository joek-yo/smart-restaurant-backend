// src/domains/customers/customers.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { FindOrCreateCustomerUseCase } from './use-cases/find-or-create-customer.usecase';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly findOrCreateCustomerUseCase: FindOrCreateCustomerUseCase,
  ) {}

  // -----------------------------
  // CREATE CUSTOMER
  // -----------------------------
  @Post()
  async createCustomer(@Body() dto: CreateCustomerDto) {
    return this.findOrCreateCustomerUseCase.execute({
      businessId: dto.businessId,
      phone: dto.phone,
      name: dto.name,
    });
  }

  // -----------------------------
  // GET BY ID (placeholder for now)
  // -----------------------------
  @Get(':id')
  async getCustomerById(@Param('id') id: string) {
    return { id };
  }

  // -----------------------------
  // UPDATE CUSTOMER
  // -----------------------------
  @Patch(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return {
      id,
      ...dto,
      updated: true,
    };
  }

  // -----------------------------
  // GET BY PHONE (multi-tenant lookup)
  // -----------------------------
  @Get('phone/:phone')
  async getByPhone(
    @Param('phone') phone: string,
    @Query('businessId') businessId: string,
  ) {
    return this.findOrCreateCustomerUseCase.execute({
      businessId,
      phone,
    });
  }
}