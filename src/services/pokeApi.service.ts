import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '../config/env';
import { PokemonCreateInput } from '../types/pokemon';

const DEFAULT_TIMEOUT = 5000;

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
}

export default new PokeApiService();
