import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rulesApi, Rule } from '../api/client'

export function useRules(stepId: string) {
  return useQuery({
    queryKey: ['rules', stepId],
    queryFn: () => rulesApi.list(stepId),
    enabled: !!stepId,
  })
}

export function useCreateRule(stepId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { condition: string; next_step_id?: string | null; priority: number }) =>
      rulesApi.create(stepId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules', stepId] })
    },
  })
}

export function useUpdateRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Rule> }) =>
      rulesApi.update(id, data),
    onSuccess: (_result, { data }) => {
      if (data.step_id) {
        queryClient.invalidateQueries({ queryKey: ['rules', data.step_id] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['rules'] })
      }
    },
  })
}

export function useReorderRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ stepId, priorities }: { stepId: string; priorities: { id: string; priority: number }[] }) =>
      rulesApi.reorder(stepId, priorities),
    onSuccess: (_result, { stepId }) => {
      queryClient.invalidateQueries({ queryKey: ['rules', stepId] })
    },
  })
}

export function useDeleteRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stepId }: { id: string; stepId: string }) => rulesApi.delete(id),
    onSuccess: (_result, { stepId }) => {
      queryClient.invalidateQueries({ queryKey: ['rules', stepId] })
    },
  })
}
