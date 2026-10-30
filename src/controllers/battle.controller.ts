import { NextFunction, Request, Response } from 'express';
import battleService from '../services/battle.service';
import { AppError } from '../middlewares/errorHandler';
import { battleTurnSchema, createBattleSchema } from '../validators/battle.validator';

class BattleController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { playerOnePokemonId, playerTwoPokemonId } = createBattleSchema.parse(req.body);
      const battle = await battleService.create(playerOnePokemonId, playerTwoPokemonId);
      res.status(201).json({ success: true, data: battle });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = this.getBattleId(req);
      const battle = await battleService.getById(id);
      res.status(200).json({ success: true, data: battle });
    } catch (error) {
      next(error);
    }
  }

  async takeTurn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { playerOneMoveId } = battleTurnSchema.parse(req.body);
      const battle = await battleService.takeTurn(this.getBattleId(req), playerOneMoveId);
      res.status(200).json({ success: true, data: battle });
    } catch (error) {
      next(error);
    }
  }

  private getBattleId(req: Request): string {
    const id = req.params.id;

    if (typeof id !== 'string') {
      throw new AppError('INVALID_BATTLE_ID', 'Invalid battle id', 400);
    }

    return id;
  }
}

export default new BattleController();
