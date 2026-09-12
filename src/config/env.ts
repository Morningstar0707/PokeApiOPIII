import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pokemon_db',
  pokeApiBaseUrl: process.env.POKEAPI_BASE_URL || 'https://pokeapi.co/api/v2',
};
