import { useState } from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, Plus } from 'lucide-react'
import { Rule, Step } from '../api/client'
import { useRules, useReorderRules, useDeleteRule } from '../hooks/useRules'
import RuleForm from './RuleForm'

interface RuleEditorProps {
  step: Step
  steps: Step[]
}

interface SortableRuleItemProps {
  rule: Rule
  steps: Step[]
  onEdit: (rule: Rule) => void
  onDelete: (rule: Rule) => void
}

function SortableRuleItem({ rule, steps, onEdit, onDelete }: SortableRuleItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rule.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const nextStep = steps.find((s) => s.id === rule.next_step_id)
  const nextStepLabel = nextStep ? nextStep.name : 'End of Workflow'

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '12px',
      }}
      className="flex items-center gap-3 px-3 py-2.5 transition-all duration-200 hover:border-indigo-500/30"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>

      <span className="w-7 text-xs font-mono text-slate-600 shrink-0">{rule.priority}</span>
      <span
        className="flex-1 text-xs font-mono text-slate-300 truncate px-2 py-1 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        {rule.condition}
      </span>
      <span className="text-xs text-slate-500 shrink-0 max-w-[90px] truncate">{nextStepLabel}</span>

      <button
        type="button"
        onClick={() => onEdit(rule)}
        className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg transition-colors"
        style={{ background: 'rgba(255,255,255,0.04)' }}
        aria-label="Edit rule"
      >
        <Pencil size={12} />
      </button>

      <button
        type="button"
        onClick={() => onDelete(rule)}
        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
        style={{ background: 'rgba(255,255,255,0.04)' }}
        aria-label="Delete rule"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

export default function RuleEditor({ step, steps }: RuleEditorProps) {
  const { data: rules = [], isLoading } = useRules(step.id)
  const reorderRules = useReorderRules()
  const deleteRule = useDeleteRule()

  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | undefined>(undefined)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = rules.findIndex((r: Rule) => r.id === active.id)
    const newIndex = rules.findIndex((r: Rule) => r.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(rules, oldIndex, newIndex)
    const priorities = reordered.map((r: Rule, i: number) => ({ id: r.id, priority: i * 10 }))
    reorderRules.mutate({ stepId: step.id, priorities })
  }

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule)
    setShowForm(true)
  }

  const handleDelete = (rule: Rule) => {
    if (window.confirm(`Delete rule "${rule.condition}"?`)) {
      deleteRule.mutate({ id: rule.id, stepId: step.id })
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingRule(undefined)
  }

  return (
    <div className="space-y-2">
      {isLoading && <p className="text-sm text-slate-500">Loading rules...</p>}

      {!isLoading && rules.length === 0 && (
        <p className="text-sm text-slate-600 italic py-4">No rules yet — add one below.</p>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rules.map((r: Rule) => r.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {rules.map((rule: Rule) => (
              <SortableRuleItem
                key={rule.id}
                rule={rule}
                steps={steps}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={() => { setEditingRule(undefined); setShowForm(true) }}
        className="flex items-center gap-1.5 mt-3 px-3 py-2 text-sm font-medium text-indigo-400 rounded-xl transition-all duration-200"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.15)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)' }}
      >
        <Plus size={13} />
        Add Rule
      </button>

      {showForm && (
        <RuleForm stepId={step.id} rule={editingRule} steps={steps} onClose={handleCloseForm} />
      )}
    </div>
  )
}
