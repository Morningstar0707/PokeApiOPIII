import axios, { AxiosError, AxiosResponse } from 'axios';
import { env } from '../config/env';
import { PokemonCombatData } from '../types/battle';
import { PokemonCreateInput } from '../types/pokemon';
import { isGenerationOneType } from '../utils/typeEffectiveness';

const DEFAULT_TIMEOUT = 5000;
interface PokemonMoveEntry {
  move: { name: string; url: string };
  version_group_details: Array<{
    version_group: { name: string };
    move_learn_method: { name: string };
    level_learned_at: number;
  }>;
}

const PHYSICAL_TYPES = new Set([
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
]);

class PokeApiService {
  private client = axios.create({
    baseURL: env.pokeApiBaseUrl,
    timeout: DEFAULT_TIMEOUT,
  });

  async getPokemonFromPokeApi(id: number): Promise<PokemonCreateInput> {
    try {
      const response: AxiosResponse = await this.client.get(`/pokemon/${id}`);

      if (!response || response.status !== 200) {
        throw new Error(`PokeAPI returned an unexpected status: ${response?.status ?? 'unknown'}`);
      }

      const pokemonData = response.data;

      const stats = pokemonData.stats.reduce(
        (acc: Record<string, number>, stat: { stat: { name: string }; base_stat: number }) => {
          acc[stat.stat.name] = stat.base_stat;
          return acc;
        },
        {},
      );

      return {
        id: pokemonData.id,
        name: pokemonData.name,
        photo: pokemonData.sprites.other['official-artwork']?.front_default || pokemonData.sprites.front_default,
        hp: stats.hp,
        attack: stats.attack,
        defense: stats.defense,
        special_attack: stats['special-attack'],
        special_defense: stats['special-defense'],
        speed: stats.speed,
        types: pokemonData.types.map((entry: { type: { name: string } }) => entry.type.name),
      };
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        throw new Error('PokeAPI request timed out');
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        if (status === 404) {
          throw new Error(`Pokemon ${id} not found in PokeAPI`);
        }
        throw new Error(`PokeAPI request failed with status ${status}`);
      }

      if (axiosError.request) {
        throw new Error('Unable to connect to PokeAPI');
      }

      throw new Error('Unexpected error while communicating with PokeAPI');
    }
  }

  async getPokemonCombatData(id: number): Promise<PokemonCombatData> {
    try {
      const response = await this.client.get(`/pokemon/${id}`);
      const pokemonData = response.data;
      const types = pokemonData.types.map((entry: { type: { name: string } }) => entry.type.name);
      const generationOneMoves = (pokemonData.moves as PokemonMoveEntry[])
        .map((entry) => {
          const level = entry.version_group_details
            .filter(
              (detail) =>
                ['red-blue', 'yellow'].includes(detail.version_group.name) &&
                detail.move_learn_method.name === 'level-up' &&
                detail.level_learned_at <= 50,
            )
            .reduce(
              (minimum, detail) => Math.min(minimum, detail.level_learned_at),
              Number.POSITIVE_INFINITY,
            );

          return Number.isFinite(level) ? { entry, level } : null;
        })
        .filter(
          (candidate): candidate is { entry: PokemonMoveEntry; level: number } =>
            candidate !== null,
        )
        .sort((left, right) => {
          const levelDifference = left.level - right.level;
          return levelDifference || left.entry.move.name.localeCompare(right.entry.move.name);
        })
        .slice(0, 12);

      if (generationOneMoves.length === 0) {
        throw new Error('No supported Generation I level-up moves were found');
      }

      const selectedMoves = generationOneMoves.map(({ entry }) => entry);
      const moveResponses = await Promise.all(
        selectedMoves.map((entry: { move: { name: string; url: string } }) =>
          this.client.get(entry.move.url),
        ),
      );
      const moves = moveResponses
        .map(({ data }) => ({
          id: data.name as string,
          name: (data.names.find(
            (entry: { language: { name: string } }) => entry.language.name === 'en',
          )?.name ?? data.name) as string,
          type: data.type.name as string,
          power: data.power as number | null,
          accuracy: (data.accuracy as number | null) ?? 100,
          damageClass: PHYSICAL_TYPES.has(data.type.name) ? 'physical' : 'special',
        }))
        .filter(
          (move): move is typeof move & { power: number; damageClass: 'physical' | 'special' } =>
            move.power !== null &&
            move.power > 0 &&
            move.accuracy >= 0 &&
            move.accuracy <= 100 &&
            isGenerationOneType(move.type),
        )
        .slice(0, 4);

      return { types, moves };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Unable to load battle data for Pokémon ${id}: ${error.message}`);
      }

      throw new Error(`Unable to load battle data for Pokémon ${id}`);
    }
  }
}

export default new PokeApiService();
