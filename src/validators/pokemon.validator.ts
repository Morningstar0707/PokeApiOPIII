import { z } from 'zod';

export const pokemonSchema = z.object({
  id: z.number({ invalid_type_error: 'id must be a number', required_error: 'id is required' }).int().positive(),
  name: z.string({ required_error: 'name is required', invalid_type_error: 'name must be a string' })
    .trim()
    .min(1, 'name must not be empty')
    .max(100, 'name cannot exceed 100 characters'),
  photo: z.string({ required_error: 'photo is required', invalid_type_error: 'photo must be a string' })
    .trim()
    .url('photo must be a valid URL'),
  hp: z.number({ invalid_type_error: 'hp must be a number', required_error: 'hp is required' }).int().positive(),
  attack: z.number({ invalid_type_error: 'attack must be a number', required_error: 'attack is required' }).int().nonnegative(),
  defense: z.number({ invalid_type_error: 'defense must be a number', required_error: 'defense is required' }).int().nonnegative(),
  special_attack: z.number({ invalid_type_error: 'special_attack must be a number', required_error: 'special_attack is required' }).int().nonnegative(),
  special_defense: z.number({ invalid_type_error: 'special_defense must be a number', required_error: 'special_defense is required' }).int().nonnegative(),
  speed: z.number({ invalid_type_error: 'speed must be a number', required_error: 'speed is required' }).int().nonnegative(),
  types: z.array(z.string().trim().min(1)).optional().default([]),
});

export const updatePokemonSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  photo: z.string().trim().url().optional(),
  hp: z.number().int().positive().optional(),
  attack: z.number().int().nonnegative().optional(),
  defense: z.number().int().nonnegative().optional(),
  special_attack: z.number().int().nonnegative().optional(),
  special_defense: z.number().int().nonnegative().optional(),
  speed: z.number().int().nonnegative().optional(),
  types: z.array(z.string().trim().min(1)).optional(),
}).strict();

export const getPokemonQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(1_000_000).optional().default(1),
  limit: z.coerce.number().int().positive().max(200).optional().default(20),
  name: z.string().trim().optional(),
  sort: z.enum(['id', 'name', 'hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed']).optional(),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});
