import prisma from '../lib/prisma'
import { NotFoundError, ValidationError } from '../middleware/errorHandler'

async function bumpWorkflowVersion(workflowId: string) {
  return prisma.workflow.update({
    where: { id: workflowId },
    data: { version: { increment: 1 } },
  })
}

export async function createRule(data: {
  step_id: string
  condition: string
  next_step_id?: string | null
  priority: number
}) {
  const step = await prisma.step.findUnique({ where: { id: data.step_id } })
  if (!step) throw new ValidationError(`Step not found: ${data.step_id}`)

  if (data.next_step_id) {
    const targetStep = await prisma.step.findUnique({ where: { id: data.next_step_id } })
    if (!targetStep || targetStep.workflow_id !== step.workflow_id) {
      throw new ValidationError('next_step_id must belong to the same workflow')
    }
  }

  const rule = await prisma.rule.create({
    data: {
      step_id: data.step_id,
      condition: data.condition,
      next_step_id: data.next_step_id ?? null,
      priority: data.priority,
    },
  })

  await bumpWorkflowVersion(step.workflow_id)
  return rule
}

export async function listRules(stepId: string) {
  return prisma.rule.findMany({
    where: { step_id: stepId },
    orderBy: { priority: 'asc' },
  })
}

export async function updateRule(
  id: string,
  data: { condition?: string; next_step_id?: string | null; priority?: number }
) {
  const existing = await prisma.rule.findUnique({ where: { id }, include: { step: true } })
  if (!existing) throw new NotFoundError(`Rule not found: ${id}`)

  const rule = await prisma.rule.update({ where: { id }, data })
  await bumpWorkflowVersion(existing.step.workflow_id)
  return rule
}

export async function deleteRule(id: string) {
  const existing = await prisma.rule.findUnique({ where: { id }, include: { step: true } })
  if (!existing) throw new NotFoundError(`Rule not found: ${id}`)

  const rule = await prisma.rule.delete({ where: { id } })
  await bumpWorkflowVersion(existing.step.workflow_id)
  return rule
}

export async function reorderRules(priorities: { id: string; priority: number }[]) {
  return prisma.$transaction(
    priorities.map(({ id, priority }) =>
      prisma.rule.update({ where: { id }, data: { priority } })
    )
  )
}
