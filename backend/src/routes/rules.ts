import { Router } from 'express'
import { updateRule, deleteRule } from '../controllers/ruleController'
import { validateBody } from '../middleware/validate'

const router = Router({ mergeParams: true })

const updateRuleSchema = {
  type: 'object',
  properties: {
    condition: { type: 'string', minLength: 1 },
    next_step_id: { type: ['string', 'null'] },
    priority: { type: 'number' },
  },
}

router.put('/:id', validateBody(updateRuleSchema), updateRule)
router.delete('/:id', deleteRule)

export default router
