# PDK Commerce Platform — Backend

A SaaS-ready multi-tenant backend built with NestJS, MongoDB, and Redis.

## Features

- Multi-tenant architecture — every request scoped to a business
- JWT authentication — register/login with bcrypt
- Business type config — feature flags driven from DB
- Catalog module — categories and products per tenant
- Orders module — full order lifecycle
- Sessions module — cart and checkout
- WhatsApp gateway — real-time messaging
- Event-driven — cross-module communication via EventBus

## Tech Stack

- NestJS + TypeScript
- MongoDB + Mongoose
- Redis (sessions/cache)
- JWT + Passport
- Socket.io (WhatsApp gateway)

## Getting Started

```bash
cp .env.example .env
# Fill in your values

npm install
npm run start:dev
```

## API Routes

### Auth
- POST /auth/register
- POST /auth/login

### Catalog (requires x-tenant-slug or x-tenant-id header)
- GET/POST /catalog/categories
- GET/POST /catalog/products
- GET/PATCH /catalog/settings

### Orders (requires tenant header)
- POST /orders
- GET /orders
- GET /orders/:id
- PATCH /orders/:id/status

### Sessions
- POST /sessions/cart
- POST /sessions/cart/remove
- POST /sessions/cart/quantity
- POST /sessions/checkout

### Business
- GET /businesses/slug/:slug
- GET /businesses/domain/:domain
- GET/PATCH /businesses/:id/storefront

## Business Types

When registering, pass `businessType` to auto-configure features:
- `restaurant` — orders, cart, delivery, whatsapp
- `retail` — orders, cart, delivery
- `salon` — bookings, SMS notifications
- `pharmacy` — orders, cart, delivery
- `gym` — bookings, push notifications
- `general` — catalog only
