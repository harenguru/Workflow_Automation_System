import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { executionsApi, Execution } from '../api/client'

const terminalStatuses = new Set(['completed', 'failed', 'canceled'])

export function useExecution(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['executions', id],
    queryFn: () => executionsApi.get(id),
    enabled: options?.enabled !== false && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (!status || terminalStatuses.has(status)) return false
      return 3000
    },
  })
}

export function useTriggerExecution(workflowId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { data: object; triggered_by: string }) =>
      executionsApi.trigger(workflowId, data),
    onSuccess: (execution: Execution) => {
      queryClient.setQueryData(['executions', execution.id], execution)
    },
  })
}

export function useCancelExecution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => executionsApi.cancel(id),
    onSuccess: (execution: Execution) => {
      queryClient.invalidateQueries({ queryKey: ['executions', execution.id] })
    },
  })
}

export function useRetryExecution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => executionsApi.retry(id),
    onSuccess: (execution: Execution) => {
      queryClient.setQueryData(['executions', execution.id], execution)
    },
  })
}

export function useDeleteExecution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => executionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions', 'list'] })
    },
  })
}
