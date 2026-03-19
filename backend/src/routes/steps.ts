import { Router } from 'express';
import { updateStep, deleteStep } from '../controllers/stepController';

const router = Router({ mergeParams: true });

router.put('/:id', updateStep);
router.delete('/:id', deleteStep);

export default router;
