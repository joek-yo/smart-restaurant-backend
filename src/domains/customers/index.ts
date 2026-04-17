// src/domains/customers/index.ts

/**
 * Customers Domain Public API
 * --------------------------
 * This file exposes ONLY stable, safe entry points
 * for other domains (Sessions, Orders, WhatsApp, etc.)
 */

// -----------------------------
// MODULE
// -----------------------------
export { CustomersModule } from './customers.module';

// -----------------------------
// USE CASES (PRIMARY ENTRY POINTS)
// -----------------------------
export { FindOrCreateCustomerUseCase } from './use-cases/find-or-create-customer.usecase';

// -----------------------------
// SERVICES (OPTIONAL INTERNAL USE ONLY)
// ⚠️ Do NOT use directly from controllers outside this domain
// -----------------------------
export { CustomerService } from './services/customer.service';