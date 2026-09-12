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
    photo: response.data.sprites.other['official-artwork']?.front_default || response.data.sprites.front_default,
    hp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    special_attack: stats['special-attack'],
    special_defense: stats['special-defense'],
    speed: stats.speed,
  };
}

async function seed() {
  try {
    for (let id = 1; id <= TOTAL_POKEMONS; id += 1) {
      console.log(`Importando Pokémon ${id}/${TOTAL_POKEMONS}...`);

      try {
        const pokemon = await fetchPokemonById(id);

        await prisma.pokemon.upsert({
          where: { id: pokemon.id },
          update: pokemon,
          create: pokemon,
        });
      } catch (error) {
        console.error(`Error al importar Pokémon ${id}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`Importación completada: ${TOTAL_POKEMONS} Pokémon.`);
  } catch (error) {
    console.error('Error durante la importación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
