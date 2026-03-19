import { useState } from 'react'
import { Step } from '../api/client'
import { useDeleteStep } from '../hooks/useSteps'
import { CheckSquare, ThumbsUp, Bell } from 'lucide-react'

const typeConfig: Record<Step['step_type'], { gradient: string; glow: string; icon: React.ElementType; label: string }> = {
  task:         { gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', glow: '0 4px 12px rgba(59,130,246,0.3)',   icon: CheckSquare, label: 'Task' },
  approval:     { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: '0 4px 12px rgba(245,158,11,0.3)',   icon: ThumbsUp,    label: 'Approval' },
  notification: { gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', glow: '0 4px 12px rgba(139,92,246,0.3)',  icon: Bell,        label: 'Notification' },
}

interface StepListProps {
  workflowId: string
  steps: Step[]
  selectedStepId: string | null
  onSelect: (step: Step) => void
  onEdit: (step: Step) => void
  startStepId?: string | null
  onSetStartStep?: (stepId: string) => void
}

export default function StepList({
  workflowId,
  steps,
  selectedStepId,
  onSelect,
  onEdit,
  startStepId,
  onSetStartStep,
}: StepListProps) {
  const deleteStep = useDeleteStep()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const sorted = [...steps].sort((a, b) => a.index - b.index)

  const handleDelete = (step: Step) => {
    deleteStep.mutate({ id: step.id, workflowId })
    setConfirmDeleteId(null)
  }

  return (
    <ul>
      {sorted.map((step, idx) => {
        const isSelected = step.id === selectedStepId
        const isStart = step.id === startStepId
        const cfg = typeConfig[step.step_type]
        const Icon = cfg.icon
        const isLast = idx === sorted.length - 1

        return (
          <li
            key={step.id}
            onClick={() => onSelect(step)}
            className="relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-200"
            style={{
              borderBottom: !isLast ? '1px solid rgba(255,255,255,0.04)' : 'none',
              borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
              background: isSelected ? 'rgba(99,102,241,0.07)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
            }}
            onMouseLeave={(e) => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            <div className="flex flex-col items-center shrink-0 mt-0.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{
                  background: isStart
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : isSelected
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'rgba(255,255,255,0.08)',
                  color: isStart || isSelected ? 'white' : '#64748b',
                  boxShadow: isStart
                    ? '0 2px 8px rgba(16,185,129,0.4)'
                    : isSelected
                    ? '0 2px 8px rgba(99,102,241,0.4)'
                    : 'none',
                }}
              >
                {step.index}
              </div>
              {!isLast && <div className="w-px h-4 mt-1" style={{ background: 'rgba(255,255,255,0.08)' }} />}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-200 truncate">{step.name}</span>
                {isStart && (
                  <span
                    className="text-[10px] font-semibold text-emerald-400 px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    entry point
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-white px-2 py-0.5 rounded-full"
                  style={{ background: cfg.gradient, boxShadow: cfg.glow }}
                >
                  <Icon size={9} />
                  {cfg.label}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
              {onSetStartStep && !isStart && (
                <button
                  onClick={() => onSetStartStep(step.id)}
                  className="text-xs px-2 py-1 text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors"
                  style={{ background: 'rgba(16,185,129,0.08)' }}
                >
                  Set Start
                </button>
              )}
              <button
                onClick={() => onEdit(step)}
                className="text-xs px-2 py-1 text-indigo-400 hover:text-indigo-300 rounded-lg transition-colors"
                style={{ background: 'rgba(99,102,241,0.08)' }}
              >
                Edit
              </button>
              {confirmDeleteId === step.id ? (
                <>
                  <button
                    onClick={() => handleDelete(step)}
                    className="text-xs px-2 py-1 text-white rounded-lg transition-colors"
                    style={{ background: 'rgba(239,68,68,0.7)' }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs px-2 py-1 text-slate-400 hover:text-slate-300 rounded-lg transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(step.id)}
                  className="text-xs px-2 py-1 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                  style={{ background: 'rgba(239,68,68,0.08)' }}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        )
      })}

      {sorted.length === 0 && (
        <li className="px-4 py-12 text-center">
          <p className="text-sm text-slate-500">No steps yet</p>
          <p className="text-xs text-slate-600 mt-1">Click "+ Add Step" to create the first step</p>
        </li>
      )}
    </ul>
  )
}
