import jexl from 'jexl'

export interface RuleEvalLog {
  ruleId: string
  condition: string
  result: boolean | null
  error?: string
  timestamp: string
}

export interface StepRuleEvalResult {
  nextStepId: string | null
  matched: boolean
  logs: RuleEvalLog[]
}

interface RuleInput {
  id: string
  condition: string
  next_step_id: string | null
  priority: number
}

const DEFAULT_CONDITION = 'DEFAULT'

export async function evaluateStepRules(
  rules: RuleInput[],
  data: Record<string, unknown>
): Promise<StepRuleEvalResult> {
  const logs: RuleEvalLog[] = []

  const sorted = [...rules].sort((a, b) => a.priority - b.priority)
  const defaultRules = sorted.filter((r) => r.condition === DEFAULT_CONDITION)
  const nonDefaultRules = sorted.filter((r) => r.condition !== DEFAULT_CONDITION)

  // evaluate non-DEFAULT rules first, in priority order
  for (const rule of nonDefaultRules) {
    const timestamp = new Date().toISOString()
    try {
      const result = await jexl.eval(rule.condition, data)
      const boolResult = result === true
      logs.push({ ruleId: rule.id, condition: rule.condition, result: boolResult, timestamp })
      if (boolResult) {
        return { nextStepId: rule.next_step_id, matched: true, logs }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      logs.push({ ruleId: rule.id, condition: rule.condition, result: null, error, timestamp })
    }
  }

  // fall back to DEFAULT rule if nothing matched
  if (defaultRules.length > 0) {
    const defaultRule = defaultRules[0]
    const timestamp = new Date().toISOString()
    logs.push({ ruleId: defaultRule.id, condition: defaultRule.condition, result: true, timestamp })
    return { nextStepId: defaultRule.next_step_id, matched: true, logs }
  }

  return { nextStepId: null, matched: false, logs }
}
