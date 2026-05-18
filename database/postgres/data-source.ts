// database/postgres/data-source.ts

import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { OrderTypeormEntity } from '../../src/modules/orders/infrastructure/persistence/postgres/entities/order.typeorm-entity';
import { OrderItemTypeormEntity } from '../../src/modules/orders/infrastructure/persistence/postgres/entities/order-item.typeorm-entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.PG_HOST ?? 'localhost',
  port: Number(process.env.PG_PORT ?? 5432),
  username: process.env.PG_USER ?? 'busivra',
  password: process.env.PG_PASSWORD ?? '',
  database: process.env.PG_DATABASE ?? 'busivra_platform',
  entities: [OrderTypeormEntity, OrderItemTypeormEntity],
  migrations: [
    'src/modules/orders/infrastructure/persistence/postgres/migrations/*{.ts,.js}',
  ],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

export default new DataSource(dataSourceOptions);
