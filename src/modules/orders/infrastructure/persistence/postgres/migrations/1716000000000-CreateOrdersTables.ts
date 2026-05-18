// src/modules/orders/infrastructure/persistence/postgres/migrations/1716000000000-CreateOrdersTables.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersTables1716000000000 implements MigrationInterface {
  name = 'CreateOrdersTables1716000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."orders_status_enum" AS ENUM (
        'PENDING',
        'ACCEPTED',
        'PREPARING',
        'READY',
        'COMPLETED',
        'CANCELLED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id"             UUID          NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"      VARCHAR(128)  NOT NULL,
        "session_id"     VARCHAR(128)  UNIQUE,
        "customer_id"    VARCHAR(128)  NOT NULL,
        "customer_name"  VARCHAR(256)  NOT NULL,
        "customer_phone" VARCHAR(64),
        "branch_id"      VARCHAR(128),
        "source"         VARCHAR(64),
        "notes"          TEXT,
        "status"         "public"."orders_status_enum" NOT NULL DEFAULT 'PENDING',
        "total_amount"   NUMERIC(12,2) NOT NULL DEFAULT 0,
        "queue_number"   INTEGER       NOT NULL DEFAULT 0,
        "created_at"     TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_tenant_id"  ON "orders" ("tenant_id");
      CREATE INDEX "IDX_orders_status"     ON "orders" ("status");
      CREATE INDEX "IDX_orders_created_at" ON "orders" ("created_at" DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id"         UUID          NOT NULL DEFAULT gen_random_uuid(),
        "order_id"   UUID          NOT NULL,
        "product_id" VARCHAR(128)  NOT NULL,
        "name"       VARCHAR(256)  NOT NULL,
        "quantity"   INTEGER       NOT NULL,
        "price"      NUMERIC(12,2) NOT NULL,
        "total"      NUMERIC(12,2) NOT NULL,
        "created_at" TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order"
          FOREIGN KEY ("order_id")
          REFERENCES "orders" ("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_order_id" ON "order_items" ("order_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
  }
}
