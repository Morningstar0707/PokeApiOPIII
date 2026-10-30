import { z } from 'zod';
import { isGenerationOneType } from '../utils/typeEffectiveness';

const generationOneTypeSchema = z.string().refine(isGenerationOneType);

export const battleMoveSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: generationOneTypeSchema,
  power: z.number().int().positive(),
  accuracy: z.number().min(0).max(100),
  damageClass: z.enum(['physical', 'special']),
});

export const pokemonCombatDataSchema = z.object({
  types: z.array(generationOneTypeSchema).min(1).max(2),
  moves: z.array(battleMoveSchema).min(1).max(4),
});
