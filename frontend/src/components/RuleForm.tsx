import { useState } from 'react'
import { Rule, Step } from '../api/client'
import { useCreateRule, useUpdateRule } from '../hooks/useRules'
import { X } from 'lucide-react'

interface RuleFormProps {
  stepId: string
  rule?: Rule
  steps: Step[]
  onClose: () => void
}

export default function RuleForm({ stepId, rule, steps, onClose }: RuleFormProps) {
  const isEdit = !!rule

  const [condition, setCondition] = useState(rule?.condition ?? '')
  const [nextStepId, setNextStepId] = useState<string | null>(rule?.next_step_id ?? null)
  const [priority, setPriority] = useState<number>(rule?.priority ?? 0)

  const createRule = useCreateRule(stepId)
  const updateRule = useUpdateRule()

  const isPending = createRule.isPending || updateRule.isPending
  const error = createRule.error || updateRule.error
  const canSubmit = condition.trim() !== ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    if (isEdit) {
      updateRule.mutate(
        { id: rule.id, data: { condition: condition.trim(), next_step_id: nextStepId, priority, step_id: stepId } },
        { onSuccess: onClose }
      )
    } else {
      createRule.mutate(
        { condition: condition.trim(), next_step_id: nextStepId, priority },
        { onSuccess: onClose }
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #13151f 0%, #0f1117 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-base font-bold text-white">{isEdit ? 'Edit Rule' : 'Add Rule'}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Condition <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              required
              placeholder='amount > 100 && country == "USA"'
              className="input-royal font-mono"
            />
            <p className="text-xs text-slate-600 mt-1.5">Uses jexl expression syntax. Use DEFAULT to always match.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Next Step</label>
            <select
              value={nextStepId ?? ''}
              onChange={(e) => setNextStepId(e.target.value === '' ? null : e.target.value)}
              className="input-royal"
              style={{ appearance: 'none', background: '#13151f', color: '#e2e8f0' }}
            >
              <option value="">End of Workflow</option>
              {steps.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              required
              min={0}
              className="input-royal"
            />
            <p className="text-xs text-slate-600 mt-1.5">Lower number = checked first</p>
          </div>

          {error && (
            <p className="text-sm text-red-400">{(error as Error).message}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2">Cancel</button>
            <button
              type="submit"
              disabled={isPending || !canSubmit}
              className="btn-primary px-4 py-2"
            >
              {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
