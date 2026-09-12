import { AppError } from '../middlewares/errorHandler';
import pokemonRepository from '../repositories/pokemon.repository';
import { Pokemon, PokemonCreateInput, PokemonQueryParams, PokemonUpdateInput } from '../types/pokemon';
import pokeApiService from './pokeApi.service';

class PokemonService {
  async getAll(params: PokemonQueryParams) {
    const { page = 1, limit = 20 } = params;
    const result = await pokemonRepository.findAll(params);

    return {
      success: true,
      data: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  async getById(id: number): Promise<Pokemon> {
    const pokemon = await pokemonRepository.findById(id);

    if (!pokemon) {
      throw new AppError('POKEMON_NOT_FOUND', 'Pokemon not found', 404);
    }

    return pokemon;
  }

  async create(data: PokemonCreateInput): Promise<Pokemon> {
    const existingById = await pokemonRepository.existsById(data.id);

    if (existingById) {
      throw new AppError('POKEMON_ALREADY_EXISTS', 'Pokemon with this id already exists', 409);
    }

    const existingByName = await pokemonRepository.existsByName(data.name);

    if (existingByName) {
      throw new AppError('POKEMON_NAME_ALREADY_EXISTS', 'Pokemon with this name already exists', 409);
    }

    return pokemonRepository.create(data);
  }

  async update(id: number, data: PokemonUpdateInput): Promise<Pokemon> {
    const pokemon = await pokemonRepository.findById(id);

    if (!pokemon) {
      throw new AppError('POKEMON_NOT_FOUND', 'Pokemon not found', 404);
    }

    if (data.name) {
      const existingByName = await pokemonRepository.existsByName(data.name);
      if (existingByName && data.name.toLowerCase() !== pokemon.name.toLowerCase()) {
        throw new AppError('POKEMON_NAME_ALREADY_EXISTS', 'Pokemon with this name already exists', 409);
      }
    }

    return pokemonRepository.update(id, data) as Promise<Pokemon>;
  }

  async delete(id: number): Promise<void> {
    const pokemon = await pokemonRepository.findById(id);

    if (!pokemon) {
      throw new AppError('POKEMON_NOT_FOUND', 'Pokemon not found', 404);
    }

    await pokemonRepository.delete(id);
  }

  async seedPokemon(): Promise<number> {
    let imported = 0;

    for (let id = 1; id <= 151; id += 1) {
      try {
        // eslint-disable-next-line no-console
        console.log(`Importando Pokémon ${id}/151...`);
        const pokemonData = await pokeApiService.getPokemonFromPokeApi(id);
        await pokemonRepository.upsert(pokemonData);
        imported += 1;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error importing Pokemon ${id}:`, error instanceof Error ? error.message : error);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`Importación completada: ${imported} Pokémon.`);

    return imported;
  }
}

export default new PokemonService();
