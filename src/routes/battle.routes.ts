import { Router } from 'express';
import battleController from '../controllers/battle.controller';

const router = Router();

router.post('/', battleController.create.bind(battleController));
router.get('/:id', battleController.getById.bind(battleController));
router.post('/:id/turns', battleController.takeTurn.bind(battleController));

export default router;
