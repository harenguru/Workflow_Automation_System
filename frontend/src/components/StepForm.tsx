import { useState } from 'react'
import { Step } from '../api/client'
import { useCreateStep, useUpdateStep } from '../hooks/useSteps'
import { Plus, Trash2, CheckSquare, ThumbsUp, Bell, X } from 'lucide-react'

interface StepFormProps {
  workflowId: string
  step?: Step
  onClose: () => void
}

const stepTypes: {
  value: Step['step_type']
  label: string
  desc: string
  icon: React.ElementType
  gradient: string
  glow: string
}[] = [
  { value: 'task',         label: 'Task',         desc: 'Automated action',   icon: CheckSquare, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', glow: '0 4px 12px rgba(59,130,246,0.3)' },
  { value: 'approval',     label: 'Approval',     desc: 'Human sign-off',     icon: ThumbsUp,    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: '0 4px 12px rgba(245,158,11,0.3)' },
  { value: 'notification', label: 'Notification', desc: 'Sends an alert',     icon: Bell,        gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', glow: '0 4px 12px rgba(139,92,246,0.3)' },
]

function metaToRows(meta: object | null | undefined): { key: string; value: string }[] {
  if (!meta || Object.keys(meta).length === 0) return []
  return Object.entries(meta).map(([key, value]) => ({
    key,
    value: typeof value === 'object' ? JSON.stringify(value) : String(value),
  }))
}

function rowsToMeta(rows: { key: string; value: string }[]): object | undefined {
  const filled = rows.filter((r) => r.key.trim() !== '')
  if (filled.length === 0) return undefined
  const obj: Record<string, unknown> = {}
  for (const { key, value } of filled) {
    if (value === 'true') obj[key.trim()] = true
    else if (value === 'false') obj[key.trim()] = false
    else if (value !== '' && !isNaN(Number(value))) obj[key.trim()] = Number(value)
    else obj[key.trim()] = value
  }
  return obj
}

export default function StepForm({ workflowId, step, onClose }: StepFormProps) {
  const isEdit = !!step

  const [name, setName] = useState(step?.name ?? '')
  const [stepType, setStepType] = useState<Step['step_type']>(step?.step_type ?? 'task')
  const [index, setIndex] = useState<number>(step?.index ?? 0)
  const [metaRows, setMetaRows] = useState<{ key: string; value: string }[]>(metaToRows(step?.metadata))

  const createStep = useCreateStep(workflowId)
  const updateStep = useUpdateStep()

  const isPending = createStep.isPending || updateStep.isPending
  const error = createStep.error || updateStep.error
  const canSubmit = name.trim() !== ''

  const addRow = () => setMetaRows((prev) => [...prev, { key: '', value: '' }])
  const removeRow = (i: number) => setMetaRows((prev) => prev.filter((_, idx) => idx !== i))
  const updateRow = (i: number, field: 'key' | 'value', val: string) =>
    setMetaRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const metadata = rowsToMeta(metaRows)
    if (isEdit) {
      updateStep.mutate(
        { id: step.id, data: { name: name.trim(), step_type: stepType, index, metadata, workflow_id: workflowId } },
        { onSuccess: onClose }
      )
    } else {
      createStep.mutate(
        { name: name.trim(), step_type: stepType, index, metadata },
        { onSuccess: onClose }
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div
        className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, #13151f 0%, #0f1117 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-base font-bold text-white">{isEdit ? 'Edit Step' : 'Add Step'}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Step Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Manager Approval"
              className="input-royal"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Step Type</label>
            <div className="grid grid-cols-3 gap-2">
              {stepTypes.map(({ value, label, desc, icon: Icon, gradient, glow }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStepType(value)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all duration-200"
                  style={
                    stepType === value
                      ? {
                          background: 'rgba(99,102,241,0.1)',
                          border: '1px solid rgba(99,102,241,0.3)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }
                  }
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={
                      stepType === value
                        ? { background: gradient, boxShadow: glow }
                        : { background: 'rgba(255,255,255,0.06)' }
                    }
                  >
                    <Icon size={15} className={stepType === value ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <span className={`text-xs font-semibold ${stepType === value ? 'text-slate-200' : 'text-slate-500'}`}>
                    {label}
                  </span>
                  <span className="text-[10px] text-slate-600 leading-tight">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Order / Index</label>
            <input
              type="number"
              value={index}
              onChange={(e) => setIndex(Number(e.target.value))}
              min={0}
              className="input-royal"
            />
            <p className="text-xs text-slate-600 mt-1.5">Lower number = runs earlier</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Extra Details</label>
                <p className="text-xs text-slate-600 mt-0.5">Optional metadata (assignee, email, timeout)</p>
              </div>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                <Plus size={11} />
                Add field
              </button>
            </div>

            {metaRows.length === 0 ? (
              <p className="text-xs text-slate-600 italic py-2">No extra details yet.</p>
            ) : (
              <div className="space-y-2">
                {metaRows.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={row.key}
                      onChange={(e) => updateRow(i, 'key', e.target.value)}
                      placeholder="Field name"
                      className="input-royal w-2/5 text-xs py-2"
                    />
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => updateRow(i, 'value', e.target.value)}
                      placeholder="Value"
                      className="input-royal flex-1 text-xs py-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400">{(error as Error).message}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2">Cancel</button>
            <button type="submit" disabled={isPending || !canSubmit} className="btn-primary px-4 py-2">
              {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Step'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
