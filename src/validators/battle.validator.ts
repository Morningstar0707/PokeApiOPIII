import { z } from 'zod';

export const createBattleSchema = z
  .object({
    playerOnePokemonId: z.number().int().min(1).max(151),
    playerTwoPokemonId: z.number().int().min(1).max(151),
  })
  .strict()
  .refine((value) => value.playerOnePokemonId !== value.playerTwoPokemonId, {
    message: 'Participants must choose different Pokémon',
  });

export const battleTurnSchema = z
  .object({
    playerOneMoveId: z.string().trim().min(1),
  })
  .strict();
