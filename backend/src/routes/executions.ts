import { Router } from 'express';
import { listExecutions, getExecution, cancelExecution, retryExecution, deleteExecution } from '../controllers/executionController';

const router = Router();

router.get('/', listExecutions);
router.get('/:id', getExecution);
router.post('/:id/cancel', cancelExecution);
router.post('/:id/retry', retryExecution);
router.delete('/:id', deleteExecution);

export default router;
