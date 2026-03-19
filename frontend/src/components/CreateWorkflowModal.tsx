import { useState } from 'react'
import { useCreateWorkflow } from '../hooks/useWorkflows'
import { useNavigate } from 'react-router-dom'
import { GitBranch, ChevronRight, X } from 'lucide-react'

interface CreateWorkflowModalProps {
  onClose: () => void
}

const presets = [
  {
    id: 'blank',
    label: 'Blank Workflow',
    description: 'Start from scratch — add your own steps and rules',
    icon: GitBranch,
    schema: null,
  },
]

export default function CreateWorkflowModal({ onClose }: CreateWorkflowModalProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState<'preset' | 'details'>('preset')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const createWorkflow = useCreateWorkflow()

  const preset = presets.find((p) => p.id === selectedPreset)

  const handlePresetNext = () => {
    if (!selectedPreset) return
    setStep('details')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createWorkflow.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        input_schema: preset?.schema ?? undefined,
      },
      {
        onSuccess: (workflow) => {
          onClose()
          navigate(`/workflows/${workflow.id}/edit`)
        },
      }
    )
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
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <h2 className="text-base font-bold text-white">
              {step === 'preset' ? 'New Workflow' : preset?.label ?? 'New Workflow'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 'preset' ? 'Choose a starting point' : 'Fill in the details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-6">
          {step === 'preset' ? (
            <>
              <div className="space-y-2 mb-6">
                {presets.map(({ id, label, description: desc, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedPreset(id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: selectedPreset === id
                        ? 'rgba(99,102,241,0.12)'
                        : 'rgba(255,255,255,0.03)',
                      border: selectedPreset === id
                        ? '1px solid rgba(99,102,241,0.35)'
                        : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: selectedPreset === id
                          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                          : 'rgba(255,255,255,0.06)',
                        boxShadow: selectedPreset === id ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                      }}
                    >
                      <Icon size={17} className={selectedPreset === id ? 'text-white' : 'text-slate-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    {selectedPreset === id && <ChevronRight size={15} className="text-indigo-400 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="btn-ghost px-4 py-2">Cancel</button>
                <button
                  type="button"
                  onClick={handlePresetNext}
                  disabled={!selectedPreset}
                  className="btn-primary px-4 py-2 disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('preset')}
                className="text-xs text-slate-500 hover:text-slate-300 mb-5 flex items-center gap-1 transition-colors"
              >
                ← Back
              </button>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    placeholder="e.g. Expense Approval"
                    className="input-royal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Optional — what does this workflow do?"
                    className="input-royal resize-none"
                  />
                </div>

                {createWorkflow.isError && (
                  <p className="text-sm text-red-400">{(createWorkflow.error as Error).message}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={onClose} className="btn-ghost px-4 py-2">Cancel</button>
                  <button
                    type="submit"
                    disabled={createWorkflow.isPending || !name.trim()}
                    className="btn-primary px-4 py-2"
                  >
                    {createWorkflow.isPending ? 'Creating...' : 'Create Workflow'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
