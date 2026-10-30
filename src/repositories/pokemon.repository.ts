import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { PokemonCombatData } from '../types/battle';
import { Pokemon, PokemonCreateInput, PokemonQueryParams, PokemonUpdateInput } from '../types/pokemon';
import { pokemonCombatDataSchema } from '../validators/battleData.validator';

class PokemonRepository {
  async findAll(params: PokemonQueryParams) {
    const { page = 1, limit = 20, name, sort = 'id', order = 'asc' } = params;

    const where: { name?: { contains: string; mode: 'insensitive' } } = name
      ? {
          name: {
            contains: name,
            mode: 'insensitive',
          },
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.pokemon.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pokemon.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<Pokemon | null> {
    return prisma.pokemon.findUnique({ where: { id } });
  }

  async findCombatData(id: number): Promise<PokemonCombatData | null> {
    const cached = await prisma.pokemonCombatCache.findUnique({ where: { pokemon_id: id } });
    if (!cached) return null;

    const parsed = pokemonCombatDataSchema.safeParse(cached.data);
    return parsed.success ? (parsed.data as PokemonCombatData) : null;
  }

  async saveCombatData(id: number, data: PokemonCombatData): Promise<void> {
    const validated = pokemonCombatDataSchema.parse(data);

    await prisma.pokemonCombatCache.upsert({
      where: { pokemon_id: id },
      create: {
        pokemon_id: id,
        data: JSON.parse(JSON.stringify(validated)) as Prisma.InputJsonValue,
      },
      update: {
        data: JSON.parse(JSON.stringify(validated)) as Prisma.InputJsonValue,
      },
    });
  }

  async create(data: PokemonCreateInput): Promise<Pokemon> {
    return prisma.pokemon.create({ data });
  }

  async update(id: number, data: PokemonUpdateInput): Promise<Pokemon | null> {
    return prisma.pokemon.update({ where: { id }, data });
  }

  async delete(id: number): Promise<Pokemon | null> {
    return prisma.pokemon.delete({ where: { id } });
  }

  async upsert(data: PokemonCreateInput): Promise<Pokemon> {
    return prisma.pokemon.upsert({
      where: { id: data.id },
      update: {
        ...data,
      },
      create: data,
    });
  }

  async existsByName(name: string): Promise<boolean> {
    const pokemon = await prisma.pokemon.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    return Boolean(pokemon);
  }

  async existsById(id: number): Promise<boolean> {
    const pokemon = await prisma.pokemon.findUnique({ where: { id } });
    return Boolean(pokemon);
  }
}

export default new PokemonRepository();
