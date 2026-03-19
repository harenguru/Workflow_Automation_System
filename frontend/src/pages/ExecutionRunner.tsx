import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkflow } from '../hooks/useWorkflows'
import { useTriggerExecution } from '../hooks/useExecution'
import JsonEditor, { isValidJson } from '../components/JsonEditor'
import { ArrowLeft, Play, DollarSign, Globe, Building2, Flag, User } from 'lucide-react'

interface FieldDef {
  type?: string
  allowed_values?: string[]
}
interface InputSchema {
  properties?: Record<string, FieldDef>
  required?: string[]
}

const FIELD_ICONS: Record<string, React.ElementType> = {
  amount: DollarSign,
  country: Globe,
  department: Building2,
  priority: Flag,
}

function FieldIcon({ name }: { name: string }) {
  const Icon = FIELD_ICONS[name.toLowerCase()]
  if (!Icon) return null
  return <Icon size={14} className="text-slate-500" />
}

function SmartField({
  name,
  def,
  required,
  value,
  onChange,
}: {
  name: string
  def: FieldDef
  required: boolean
  value: string
  onChange: (v: string) => void
}) {
  const label = name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const hasIcon = !!FIELD_ICONS[name.toLowerCase()]

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {def.allowed_values && def.allowed_values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {def.allowed_values.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={
                value === v
                  ? {
                      background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                      border: '1px solid transparent',
                    }
                  : {
                      background: 'rgba(255,255,255,0.04)',
                      color: '#94a3b8',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }
              }
            >
              {v}
            </button>
          ))}
        </div>
      ) : (
        <div className="relative">
          {hasIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <FieldIcon name={name} />
            </div>
          )}
          <input
            type="text"
            inputMode={def.type === 'number' ? 'numeric' : 'text'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className="input-royal"
            style={{ paddingLeft: hasIcon ? '2.5rem' : '1rem' }}
          />
        </div>
      )}
    </div>
  )
}

export default function ExecutionRunner() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: workflow, isLoading, error } = useWorkflow(id!)
  const trigger = useTriggerExecution(id!)

  const [triggeredBy, setTriggeredBy] = useState('')
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [rawJson, setRawJson] = useState('{}')
  const [useRawJson, setUseRawJson] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const schema = workflow?.input_schema as InputSchema | null
  const hasSchema = !!(schema?.properties && Object.keys(schema.properties).length > 0)

  useEffect(() => {
    if (!workflow) return
    if (hasSchema && schema?.properties) {
      const init: Record<string, string> = {}
      for (const key of Object.keys(schema.properties)) {
        init[key] = ''
      }
      setFormValues(init)
    }
  }, [workflow?.id])

  const buildPayload = (): object => {
    if (!hasSchema || useRawJson) {
      return rawJson.trim() ? JSON.parse(rawJson) : {}
    }
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(formValues)) {
      const def = schema?.properties?.[key]
      if (val === '') continue
      result[key] = def?.type === 'number' ? Number(val) : val
    }
    return result
  }

  const handleStart = async () => {
    setSubmitError(null)
    if (!triggeredBy.trim()) {
      setSubmitError('Please enter who is triggering this execution.')
      return
    }
    if (useRawJson && !isValidJson(rawJson)) {
      setSubmitError('Please enter valid JSON.')
      return
    }
    try {
      const payload = buildPayload()
      const execution = await trigger.mutateAsync({ data: payload, triggered_by: triggeredBy.trim() })
      navigate(`/executions/${execution.id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to start execution.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !workflow) {
    return (
      <div className="p-8 text-center text-red-400 text-sm">
        {error instanceof Error ? error.message : 'Workflow not found.'}
      </div>
    )
  }

  const required = new Set(schema?.required ?? [])

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(`/workflows/${id}/edit`)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Back to editor
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}
        >
          <Play size={17} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{workflow.name}</h1>
          <span
            className="text-xs font-mono text-slate-500 px-2 py-0.5 rounded-lg mt-0.5 inline-block"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            v{workflow.version}
          </span>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Triggered by */}
        <div className="p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Your Name / ID <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" />
            <input
              type="text"
              value={triggeredBy}
              onChange={(e) => setTriggeredBy(e.target.value)}
              placeholder="e.g. john.doe, admin, system"
              className="input-royal"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-1.5">Who is triggering this workflow run</p>
        </div>

        {/* Input fields */}
        <div className="p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-slate-300">Workflow Inputs</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasSchema
                  ? 'Fill in the fields — these values route the workflow.'
                  : 'No input fields defined for this workflow.'}
              </p>
            </div>
            {hasSchema && (
              <button
                type="button"
                onClick={() => setUseRawJson((v) => !v)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {useRawJson ? 'Use form' : 'Use JSON'}
              </button>
            )}
          </div>

          {hasSchema && !useRawJson && schema?.properties ? (
            <div className="space-y-5">
              {Object.entries(schema.properties).map(([key, def]) => (
                <SmartField
                  key={key}
                  name={key}
                  def={def}
                  required={required.has(key)}
                  value={formValues[key] ?? ''}
                  onChange={(v) => setFormValues((prev) => ({ ...prev, [key]: v }))}
                />
              ))}
            </div>
          ) : (
            <JsonEditor label="" value={rawJson} onChange={setRawJson} rows={8} />
          )}
        </div>

        {/* Submit */}
        <div className="p-6 space-y-3">
          {submitError && (
            <div
              className="px-4 py-3 rounded-xl text-sm text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {submitError}
            </div>
          )}
          <button
            onClick={handleStart}
            disabled={trigger.isPending}
            className="btn-primary w-full py-3"
          >
            {trigger.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting execution...
              </>
            ) : (
              <>
                <Play size={15} />
                Run Workflow
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
