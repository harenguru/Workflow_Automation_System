import prisma from '../lib/prisma'
import { NotFoundError } from '../middleware/errorHandler'

export async function createWorkflow(data: {
  name: string
  description?: string
  input_schema?: object
}) {
  return prisma.workflow.create({
    data: {
      name: data.name,
      description: data.description,
      input_schema: data.input_schema,
      version: 1,
      is_active: false,
    },
  })
}

export async function listWorkflows(params: { page?: number; limit?: number; search?: string }) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit

  const where = params.search
    ? { name: { contains: params.search, mode: 'insensitive' as const } }
    : {}

  const [data, total] = await Promise.all([
    prisma.workflow.findMany({ where, skip, take: limit, orderBy: { created_at: 'asc' }, include: { _count: { select: { steps: true } } } }),
    prisma.workflow.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function getWorkflowById(id: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: { _count: { select: { steps: true } } },
  })
  if (!workflow) throw new NotFoundError(`Workflow not found: ${id}`)
  return workflow
}

export async function updateWorkflow(
  id: string,
  data: {
    name?: string
    description?: string
    is_active?: boolean
    input_schema?: object
    start_step_id?: string
  }
) {
  const existing = await prisma.workflow.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError(`Workflow not found: ${id}`)
  return prisma.workflow.update({ where: { id }, data })
}

export async function deleteWorkflow(id: string) {
  const existing = await prisma.workflow.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError(`Workflow not found: ${id}`)
  // delete executions first to clear audit history and avoid FK constraint errors
  await prisma.execution.deleteMany({ where: { workflow_id: id } })
  return prisma.workflow.delete({ where: { id } })
}
