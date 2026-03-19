import { Router } from 'express'
import {
  createWorkflow,
  listWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from '../controllers/workflowController'
import { createStep, listSteps } from '../controllers/stepController'
import { triggerExecution } from '../controllers/executionController'
import { validateBody } from '../middleware/validate'

const router = Router()

const createWorkflowSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    input_schema: { type: 'object' },
  },
}

const createStepSchema = {
  type: 'object',
  required: ['name', 'step_type', 'index'],
  properties: {
    name: { type: 'string', minLength: 1 },
    step_type: { type: 'string', enum: ['task', 'approval', 'notification'] },
    index: { type: 'number' },
    metadata: { type: 'object' },
  },
}

const triggerSchema = {
  type: 'object',
  required: ['triggered_by'],
  properties: {
    triggered_by: { type: 'string', minLength: 1 },
    data: { type: 'object' },
  },
}

router.post('/', validateBody(createWorkflowSchema), createWorkflow)
router.get('/', listWorkflows)
router.get('/:id', getWorkflow)
router.put('/:id', updateWorkflow)
router.delete('/:id', deleteWorkflow)

router.post('/:workflowId/steps', validateBody(createStepSchema), createStep)
router.get('/:workflowId/steps', listSteps)

router.post('/:workflowId/execute', validateBody(triggerSchema), triggerExecution)

export default router
