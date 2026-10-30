import { Router } from 'express';
import pokemonController from '../controllers/pokemon.controller';
import { requireWriteKey } from '../middlewares/requireWriteKey';

const router = Router();

router.get('/', pokemonController.getAll);
router.get('/:id', pokemonController.getById);
router.post('/', requireWriteKey, pokemonController.create);
router.put('/:id', requireWriteKey, pokemonController.update);
router.delete('/:id', requireWriteKey, pokemonController.delete);

export default router;
