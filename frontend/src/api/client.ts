export interface Workflow {
  id: string
  name: string
  description: string | null
  is_active: boolean
  version: number
  input_schema: object | null
  start_step_id: string | null
  created_at: string
  updated_at: string
  _count?: { steps: number }
}

export interface Step {
  id: string
  workflow_id: string
  name: string
  step_type: 'task' | 'approval' | 'notification'
  index: number
  metadata: object | null
  created_at: string
  updated_at: string
}

export interface Rule {
  id: string
  step_id: string
  condition: string
  next_step_id: string | null
  priority: number
  created_at: string
  updated_at: string
}

export interface ExecutionLogEntry {
  type: 'step' | 'error' | 'cancel' | 'loop_limit'
  stepId?: string
  stepName?: string
  rulesEvaluated?: Array<{
    ruleId: string
    condition: string
    result: boolean | null
    error?: string
    timestamp: string
  }>
  nextStepId?: string | null
  durationMs?: number
  errorMessage?: string
  timestamp: string
}

export interface Execution {
  id: string
  workflow_id: string
  workflow_version: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'canceled'
  data: object
  current_step_id: string | null
  retries: number
  triggered_by: string
  started_at: string | null
  ended_at: string | null
  logs: ExecutionLogEntry[]
  created_at: string
  updated_at: string
  workflow?: { name: string }
}

export interface PaginatedWorkflows {
  data: Workflow[]
  total: number
  page: number
  limit: number
}

export interface PaginatedExecutions {
  data: Execution[]
  total: number
  page: number
  limit: number
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = import.meta.env.VITE_API_URL ?? ''
  const url = `${base}/api${path}`
  const options: RequestInit = { ...init }

  if (init?.method && init.method !== 'GET') {
    options.headers = {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    }
  }

  const res = await fetch(url, options)

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }

  return res.json() as Promise<T>
}

export const workflowsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.page != null) query.set('page', String(params.page))
    if (params?.limit != null) query.set('limit', String(params.limit))
    if (params?.search) query.set('search', params.search)
    const qs = query.toString()
    return apiFetch<PaginatedWorkflows>(`/workflows${qs ? `?${qs}` : ''}`)
  },
  get: (id: string) => apiFetch<Workflow>(`/workflows/${id}`),
  create: (data: { name: string; description?: string; input_schema?: object }) =>
    apiFetch<Workflow>('/workflows', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Workflow>) =>
    apiFetch<Workflow>(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/workflows/${id}`, { method: 'DELETE' }),
}

export const stepsApi = {
  list: (workflowId: string) => apiFetch<Step[]>(`/workflows/${workflowId}/steps`),
  create: (workflowId: string, data: { name: string; step_type: string; index: number; metadata?: object }) =>
    apiFetch<Step>(`/workflows/${workflowId}/steps`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Step>) =>
    apiFetch<Step>(`/steps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/steps/${id}`, { method: 'DELETE' }),
}

export const rulesApi = {
  list: (stepId: string) => apiFetch<Rule[]>(`/steps/${stepId}/rules`),
  create: (stepId: string, data: { condition: string; next_step_id?: string | null; priority: number }) =>
    apiFetch<Rule>(`/steps/${stepId}/rules`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Rule>) =>
    apiFetch<Rule>(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  reorder: (stepId: string, priorities: { id: string; priority: number }[]) =>
    apiFetch<Rule[]>(`/steps/${stepId}/rules/reorder`, { method: 'PUT', body: JSON.stringify({ priorities }) }),
  delete: (id: string) => apiFetch<void>(`/rules/${id}`, { method: 'DELETE' }),
}

export const executionsApi = {
  list: (params?: { page?: number; limit?: number; workflow_id?: string }) => {
    const query = new URLSearchParams()
    if (params?.page != null) query.set('page', String(params.page))
    if (params?.limit != null) query.set('limit', String(params.limit))
    if (params?.workflow_id) query.set('workflow_id', params.workflow_id)
    const qs = query.toString()
    return apiFetch<PaginatedExecutions>(`/executions${qs ? `?${qs}` : ''}`)
  },
  trigger: (workflowId: string, data: { data: object; triggered_by: string }) =>
    apiFetch<Execution>(`/workflows/${workflowId}/execute`, { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => apiFetch<Execution>(`/executions/${id}`),
  cancel: (id: string) => apiFetch<Execution>(`/executions/${id}/cancel`, { method: 'POST' }),
  retry: (id: string) => apiFetch<Execution>(`/executions/${id}/retry`, { method: 'POST' }),
  delete: (id: string) => apiFetch<void>(`/executions/${id}`, { method: 'DELETE' }),
}
