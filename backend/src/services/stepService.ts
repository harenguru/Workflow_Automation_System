import prisma from '../lib/prisma'
import { NotFoundError, ValidationError } from '../middleware/errorHandler'

type StepType = 'task' | 'approval' | 'notification'

async function bumpWorkflowVersion(workflowId: string) {
  return prisma.workflow.update({
    where: { id: workflowId },
    data: { version: { increment: 1 } },
  })
}

export async function createStep(data: {
  workflow_id: string
  name: string
  step_type: StepType
  index: number
  metadata?: object
}) {
  const workflow = await prisma.workflow.findUnique({ where: { id: data.workflow_id } })
  if (!workflow) throw new ValidationError(`Workflow not found: ${data.workflow_id}`)

  const step = await prisma.step.create({
    data: {
      workflow_id: data.workflow_id,
      name: data.name,
      step_type: data.step_type,
      index: data.index,
      metadata: data.metadata,
    },
  })

  await bumpWorkflowVersion(data.workflow_id)
  return step
}

export async function listSteps(workflowId: string) {
  return prisma.step.findMany({
    where: { workflow_id: workflowId },
    orderBy: { index: 'asc' },
    include: { _count: { select: { rules: true } } },
  })
}

export async function updateStep(
  id: string,
  data: { name?: string; step_type?: StepType; index?: number; metadata?: object }
) {
  const existing = await prisma.step.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError(`Step not found: ${id}`)

  const step = await prisma.step.update({ where: { id }, data })
  await bumpWorkflowVersion(existing.workflow_id)
  return step
}

export async function deleteStep(id: string) {
  const existing = await prisma.step.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError(`Step not found: ${id}`)

  const step = await prisma.step.delete({ where: { id } })
  await bumpWorkflowVersion(existing.workflow_id)
  return step
}
