import { Router } from 'express';
import pokemonController from '../controllers/pokemon.controller';

const router = Router();

router.get('/', pokemonController.getAll);
router.get('/:id', pokemonController.getById);
router.post('/', pokemonController.create);
router.put('/:id', pokemonController.update);
router.delete('/:id', pokemonController.delete);

export default router;
