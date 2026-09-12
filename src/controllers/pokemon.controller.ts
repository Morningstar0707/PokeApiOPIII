import { NextFunction, Request, Response } from 'express';
import pokemonService from '../services/pokemon.service';
import { AppError } from '../middlewares/errorHandler';
import { getPokemonQuerySchema, pokemonSchema, updatePokemonSchema } from '../validators/pokemon.validator';

class PokemonController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = getPokemonQuerySchema.parse(req.query);
      const result = await pokemonService.getAll(parsed);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        throw new AppError('INVALID_POKEMON_ID', 'Invalid pokemon id', 400);
      }

      const pokemon = await pokemonService.getById(id);
      res.status(200).json({ success: true, data: pokemon });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = pokemonSchema.parse(req.body);
      const pokemon = await pokemonService.create(parsed);
      res.status(201).json({ success: true, data: pokemon });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        throw new AppError('INVALID_POKEMON_ID', 'Invalid pokemon id', 400);
      }

      const parsed = updatePokemonSchema.parse(req.body);
      const pokemon = await pokemonService.update(id, parsed);
      res.status(200).json({ success: true, data: pokemon });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        throw new AppError('INVALID_POKEMON_ID', 'Invalid pokemon id', 400);
      }

      await pokemonService.delete(id);
      res.status(200).json({ success: true, message: 'Pokemon deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new PokemonController();
