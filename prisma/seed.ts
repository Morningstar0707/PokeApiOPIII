import prisma from '../src/config/prisma';
import { env } from '../src/config/env';
import axios from 'axios';
import { PokemonCreateInput } from '../src/types/pokemon';

const TOTAL_POKEMONS = 151;

async function fetchPokemonById(id: number): Promise<PokemonCreateInput> {
  const response = await axios.get(`${env.pokeApiBaseUrl}/pokemon/${id}`, { timeout: 5000 });

  const stats = response.data.stats.reduce(
    (acc: Record<string, number>, stat: { stat: { name: string }; base_stat: number }) => {
      acc[stat.stat.name] = stat.base_stat;
      return acc;
    },
    {},
  );

  return {
    id: response.data.id,
    name: response.data.name,
    photo:
      response.data.sprites.other['official-artwork']?.front_default ||
      response.data.sprites.front_default,
    hp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    special_attack: stats['special-attack'],
    special_defense: stats['special-defense'],
    speed: stats.speed,
    types: response.data.types.map((entry: { type: { name: string } }) => entry.type.name),
  };
}

async function seed(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      'No se pudo iniciar la importación: falta DATABASE_URL. Configura la conexión a PostgreSQL en .env o en el entorno.',
    );
    process.exitCode = 1;
    return;
  }

  let imported = 0;
  const failedIds: number[] = [];

  try {
    await prisma.$connect();

    for (let id = 1; id <= TOTAL_POKEMONS; id += 1) {
      console.log(`Importando Pokémon ${id}/${TOTAL_POKEMONS}...`);

      let pokemon: PokemonCreateInput;
      try {
        pokemon = await fetchPokemonById(id);
      } catch (error) {
        failedIds.push(id);
        console.error(
          `Error al consultar Pokémon ${id} en PokeAPI:`,
          error instanceof Error ? error.message : error,
        );
        continue;
      }

      await prisma.pokemon.upsert({
        where: { id: pokemon.id },
        update: pokemon,
        create: pokemon,
      });
      imported += 1;
    }

    console.log(`Importación finalizada: ${imported}/${TOTAL_POKEMONS} Pokémon guardados.`);

    if (failedIds.length > 0) {
      console.error(`No se pudieron consultar estos IDs en PokeAPI: ${failedIds.join(', ')}`);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(
      'La importación se detuvo por un error de base de datos. No se reportaron registros no guardados como exitosos:',
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void seed();
