import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stepsApi, Step } from '../api/client'

export function useSteps(workflowId: string) {
  return useQuery({
    queryKey: ['steps', workflowId],
    queryFn: () => stepsApi.list(workflowId),
    enabled: !!workflowId,
  })
}

export function useCreateStep(workflowId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; step_type: string; index: number; metadata?: object }) =>
      stepsApi.create(workflowId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steps', workflowId] })
      queryClient.invalidateQueries({ queryKey: ['workflows', workflowId] })
    },
  })
}

export function useUpdateStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Step> }) =>
      stepsApi.update(id, data),
    onSuccess: (_result, { data }) => {
      if (data.workflow_id) {
        queryClient.invalidateQueries({ queryKey: ['steps', data.workflow_id] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['steps'] })
      }
    },
  })
}

export function useDeleteStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, workflowId }: { id: string; workflowId: string }) =>
      stepsApi.delete(id),
    onSuccess: (_result, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: ['steps', workflowId] })
      queryClient.invalidateQueries({ queryKey: ['workflows', workflowId] })
    },
  })
}
