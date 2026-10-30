import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://postgres:postgres@localhost:5432/pokemon_db'),
  POKEAPI_BASE_URL: z.string().url().default('https://pokeapi.co/api/v2'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://127.0.0.1:5173'),
  API_WRITE_KEY: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().min(32).optional(),
  ),
});

const values = envSchema.parse(process.env);

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = values.DATABASE_URL;
}

export const env = {
  nodeEnv: values.NODE_ENV,
  port: values.PORT,
  databaseUrl: values.DATABASE_URL,
  pokeApiBaseUrl: values.POKEAPI_BASE_URL,
  corsOrigins: values.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  apiWriteKey: values.API_WRITE_KEY?.trim(),
};
