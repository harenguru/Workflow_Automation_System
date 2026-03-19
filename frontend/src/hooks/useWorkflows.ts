import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workflowsApi, Workflow } from '../api/client'

export function useWorkflows(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['workflows', params],
    queryFn: () => workflowsApi.list(params),
  })
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflows', id],
    queryFn: () => workflowsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string; input_schema?: object }) =>
      workflowsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Workflow> }) =>
      workflowsApi.update(id, data),
    onSuccess: (_result: Workflow, { id }: { id: string; data: Partial<Workflow> }) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflows', id] })
    },
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workflowsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['executions'] })
    },
  })
}
