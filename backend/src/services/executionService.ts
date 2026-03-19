import Ajv from 'ajv'
import prisma from '../lib/prisma'
import { NotFoundError, ValidationError } from '../middleware/errorHandler'
import { enqueueExecution } from '../queue/producer'

const ajv = new Ajv()

export async function triggerExecution(workflowId: string, data: { data: object; triggered_by: string }) {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } })
  if (!workflow) throw new NotFoundError(`Workflow not found: ${workflowId}`)

  if (!workflow.start_step_id) {
    throw new ValidationError('Workflow has no start step configured')
  }

  if (workflow.input_schema && Object.keys(workflow.input_schema).length > 0) {
    const schema = workflow.input_schema as {
      properties?: Record<string, { type?: string; required?: boolean; allowed_values?: string[] }>
      required?: string[]
    }

    const cleanSchema: Record<string, unknown> = { type: 'object' }
    if (schema.required) cleanSchema.required = schema.required
    if (schema.properties) {
      const props: Record<string, unknown> = {}
      for (const [key, def] of Object.entries(schema.properties)) {
        props[key] = { type: def.type ?? 'string' }
      }
      cleanSchema.properties = props
    }

    const validate = ajv.compile(cleanSchema)
    const valid = validate(data.data)
    if (!valid) {
      throw new ValidationError(ajv.errorsText(validate.errors))
    }

    if (schema.properties) {
      for (const [key, def] of Object.entries(schema.properties)) {
        if (def.allowed_values && def.allowed_values.length > 0) {
          const val = (data.data as Record<string, unknown>)[key]
          if (val !== undefined && !def.allowed_values.includes(val as string)) {
            throw new ValidationError(`Invalid value for "${key}": must be one of ${def.allowed_values.join(', ')}`)
          }
        }
      }
    }
  }

  const execution = await prisma.execution.create({
    data: {
      workflow_id: workflowId,
      workflow_version: workflow.version,
      data: data.data,
      triggered_by: data.triggered_by,
      status: 'pending',
    },
  })

  await enqueueExecution(execution.id)
  return execution
}

export async function listExecutions(params: { page?: number; limit?: number; workflowId?: string }) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit
  const where = params.workflowId ? { workflow_id: params.workflowId } : {}

  const [data, total] = await Promise.all([
    prisma.execution.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: { workflow: { select: { name: true } } },
    }),
    prisma.execution.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function getExecution(id: string) {
  const execution = await prisma.execution.findUnique({
    where: { id },
    include: { workflow: { select: { name: true } } },
  })
  if (!execution) throw new NotFoundError(`Execution not found: ${id}`)
  return execution
}

export async function cancelExecution(id: string) {
  const execution = await prisma.execution.findUnique({ where: { id } })
  if (!execution) throw new NotFoundError(`Execution not found: ${id}`)

  const terminalStatuses = ['completed', 'failed', 'canceled']
  if (terminalStatuses.includes(execution.status)) {
    throw new ValidationError(`Cannot cancel execution with status: ${execution.status}`)
  }

  const logs = Array.isArray(execution.logs) ? execution.logs : []
  const updatedLogs = [
    ...logs,
    { timestamp: new Date().toISOString(), message: 'Execution canceled by user' },
  ]

  return prisma.execution.update({
    where: { id },
    data: { status: 'canceled', ended_at: new Date(), logs: updatedLogs },
  })
}

export async function deleteExecution(id: string) {
  const execution = await prisma.execution.findUnique({ where: { id } })
  if (!execution) throw new NotFoundError(`Execution not found: ${id}`)
  await prisma.execution.delete({ where: { id } })
}

export async function retryExecution(id: string) {
  const execution = await prisma.execution.findUnique({ where: { id } })
  if (!execution) throw new NotFoundError(`Execution not found: ${id}`)

  if (execution.status !== 'failed') {
    throw new ValidationError('Can only retry failed executions')
  }

  const newExecution = await prisma.execution.create({
    data: {
      workflow_id: execution.workflow_id,
      data: execution.data ?? {},
      triggered_by: execution.triggered_by,
      workflow_version: execution.workflow_version,
      retries: execution.retries + 1,
      status: 'pending',
    },
  })

  await enqueueExecution(newExecution.id)
  return newExecution
}
