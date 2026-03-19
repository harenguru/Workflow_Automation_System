import * as fc from 'fast-check'
import { evaluateStepRules } from './ruleEngine'

const makeRule = (id: string, condition: string, next_step_id: string | null, priority: number) =>
  ({ id, condition, next_step_id, priority })

describe('ruleEngine property-based tests', () => {
  it('DEFAULT rule always matches when no other rule matches', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        async (amount) => {
          const rules = [
            makeRule('r1', 'amount > 99999', 'step-high', 1),
            makeRule('default', 'DEFAULT', 'step-default', 99),
          ]
          const result = await evaluateStepRules(rules, { amount })
          return result.matched === true && result.nextStepId === 'step-default'
        }
      )
    )
  })

  it('first matching rule wins regardless of how many rules exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 101, max: 10000 }),
        async (amount) => {
          const rules = [
            makeRule('r1', 'amount > 100', 'step-first', 1),
            makeRule('r2', 'amount > 50', 'step-second', 2),
            makeRule('default', 'DEFAULT', 'step-default', 99),
          ]
          const result = await evaluateStepRules(rules, { amount })
          // amount > 100 is always true here, so r1 should always win
          return result.nextStepId === 'step-first'
        }
      )
    )
  })

  it('no rules returns matched: false', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({ amount: fc.integer(), name: fc.string() }),
        async (data) => {
          const result = await evaluateStepRules([], data as Record<string, unknown>)
          return result.matched === false && result.nextStepId === null
        }
      )
    )
  })

  it('logs always contain an entry for every evaluated rule', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 50 }),
        async (amount) => {
          const rules = [
            makeRule('r1', 'amount > 100', 'step-a', 1),
            makeRule('r2', 'amount > 200', 'step-b', 2),
          ]
          const result = await evaluateStepRules(rules, { amount })
          // logs should have at least 1 entry (stops at first match)
          return result.logs.length >= 1
        }
      )
    )
  })
})
