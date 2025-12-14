import { defineConfig, env } from 'prisma/config';
import { config } from 'dotenv';
import path from 'path';

config();

export default defineConfig({
  schema: path.join('prisma/schema'),
  migrations: {
    path: 'prisma/schema/migrations',
    seed: 'prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
