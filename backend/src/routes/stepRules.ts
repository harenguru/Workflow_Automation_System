import { Router } from 'express'
import { createRule, listRules, reorderRulesHandler } from '../controllers/ruleController'
import { validateBody } from '../middleware/validate'

const router = Router({ mergeParams: true })

const createRuleSchema = {
  type: 'object',
  required: ['condition', 'priority'],
  properties: {
    condition: { type: 'string', minLength: 1 },
    next_step_id: { type: ['string', 'null'] },
    priority: { type: 'number' },
  },
}

router.post('/steps/:stepId/rules', validateBody(createRuleSchema), createRule)
router.get('/steps/:stepId/rules', listRules)
router.put('/steps/:stepId/rules/reorder', reorderRulesHandler)

export default router
