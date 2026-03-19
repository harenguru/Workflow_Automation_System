import prisma from '../lib/prisma'
import { evaluateStepRules, RuleEvalLog } from './ruleEngine'

const MAX_ITERATIONS = 50

export interface ExecutionLogEntry {
  type: 'step' | 'error' | 'cancel' | 'loop_limit'
  stepId?: string
  stepName?: string
  rulesEvaluated?: RuleEvalLog[]
  nextStepId?: string | null
  durationMs?: number
  errorMessage?: string
  timestamp: string
}

export interface EngineRunResult {
  status: 'completed' | 'failed' | 'canceled'
  endedAt: Date
  logs: ExecutionLogEntry[]
  failureReason?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logsToJson(logs: ExecutionLogEntry[]): any {
  return logs as unknown
}

export async function runExecution(executionId: string): Promise<EngineRunResult> {
  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
    include: { workflow: true },
  })

  if (!execution) {
    throw new Error(`Execution not found: ${executionId}`)
  }

  await prisma.execution.update({
    where: { id: executionId },
    data: { status: 'in_progress', started_at: new Date() },
  })

  const logs: ExecutionLogEntry[] = (execution.logs as unknown as ExecutionLogEntry[]) ?? []
  let currentStepId: string | null = execution.current_step_id ?? execution.workflow.start_step_id ?? null

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const refreshed = await prisma.execution.findUnique({
      where: { id: executionId },
      select: { status: true },
    })

    if (refreshed?.status === 'canceled') {
      logs.push({ type: 'cancel', timestamp: new Date().toISOString() })
      return { status: 'canceled', endedAt: new Date(), logs }
    }

    if (currentStepId === null) {
      const now = new Date()
      await prisma.execution.update({
        where: { id: executionId },
        data: { status: 'completed', ended_at: now, logs: logsToJson(logs) },
      })
      return { status: 'completed', endedAt: now, logs }
    }

    const step = await prisma.step.findUnique({
      where: { id: currentStepId },
      include: { rules: true },
    })

    if (!step) {
      const now = new Date()
      logs.push({ type: 'error', errorMessage: `Step not found: ${currentStepId}`, timestamp: new Date().toISOString() })
      await prisma.execution.update({
        where: { id: executionId },
        data: { status: 'failed', ended_at: now, logs: logsToJson(logs) },
      })
      return { status: 'failed', endedAt: now, logs, failureReason: `Step not found: ${currentStepId}` }
    }

    const stepStartTime = Date.now()
    const result = await evaluateStepRules(step.rules, execution.data as Record<string, unknown>)
    const durationMs = Date.now() - stepStartTime

    logs.push({
      type: 'step',
      stepId: step.id,
      stepName: step.name,
      rulesEvaluated: result.logs,
      nextStepId: result.nextStepId,
      durationMs,
      timestamp: new Date().toISOString(),
    })

    await prisma.execution.update({
      where: { id: executionId },
      data: { current_step_id: result.nextStepId, logs: logsToJson(logs) },
    })

    if (!result.matched) {
      const now = new Date()
      await prisma.execution.update({
        where: { id: executionId },
        data: { status: 'failed', ended_at: now },
      })
      return { status: 'failed', endedAt: now, logs, failureReason: 'No matching rule' }
    }

    currentStepId = result.nextStepId
  }

  const now = new Date()
  logs.push({ type: 'loop_limit', timestamp: new Date().toISOString() })
  await prisma.execution.update({
    where: { id: executionId },
    data: { status: 'failed', ended_at: now, logs: logsToJson(logs) },
  })

  return { status: 'failed', endedAt: now, logs, failureReason: 'Max iterations reached' }
}
