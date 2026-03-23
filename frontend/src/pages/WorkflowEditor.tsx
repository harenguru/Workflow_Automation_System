import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkflow, useUpdateWorkflow } from '../hooks/useWorkflows'
import { useSteps } from '../hooks/useSteps'
import { Step } from '../api/client'
import JsonEditor, { isValidJson } from '../components/JsonEditor'
import StepList from '../components/StepList'
import StepForm from '../components/StepForm'
import RuleEditor from '../components/RuleEditor'
import { ArrowLeft, Play } from 'lucide-react'

export default function WorkflowEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const workflowId = id ?? ''

  const { data: workflow, isLoading: wfLoading, isError: wfError } = useWorkflow(workflowId)
  const { data: steps = [] } = useSteps(workflowId)
  const updateWorkflow = useUpdateWorkflow()

  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [inputSchemaStr, setInputSchemaStr] = useState('')
  const [formInitialised, setFormInitialised] = useState(false)

  const [selectedStep, setSelectedStep] = useState<Step | null>(null)
  const [showStepForm, setShowStepForm] = useState(false)
  const [editingStep, setEditingStep] = useState<Step | undefined>(undefined)

  if (workflow && !formInitialised) {
    setName(workflow.name)
    setIsActive(workflow.is_active)
    setInputSchemaStr(workflow.input_schema ? JSON.stringify(workflow.input_schema, null, 2) : '')
    setFormInitialised(true)
  }

  const schemaValid = isValidJson(inputSchemaStr)
  const canSave = name.trim() !== '' && schemaValid && !updateWorkflow.isPending

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    const input_schema = inputSchemaStr.trim() ? JSON.parse(inputSchemaStr) : null
    updateWorkflow.mutate({ id: workflowId, data: { name: name.trim(), is_active: isActive, input_schema } })
  }

  const handleSetStartStep = (stepId: string) => {
    updateWorkflow.mutate({ id: workflowId, data: { start_step_id: stepId } })
  }

  const handleEditStep = (step: Step) => {
    setEditingStep(step)
    setShowStepForm(true)
  }

  const handleAddStep = () => {
    setEditingStep(undefined)
    setShowStepForm(true)
  }

  const handleCloseStepForm = () => {
    setShowStepForm(false)
    setEditingStep(undefined)
  }

  if (wfLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (wfError || !workflow) {
    return (
      <div className="p-8 text-center text-red-400 text-sm">
        Failed to load workflow.{' '}
        <button onClick={() => navigate('/')} className="underline text-indigo-400">Go back</button>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-1 transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-white">Edit Workflow</h1>
          <p className="text-sm text-slate-500 mt-0.5">{workflow.name}</p>
        </div>
        <button
          onClick={() => navigate(`/workflows/${workflowId}/execute`)}
          className="btn-primary"
        >
          <Play size={14} />
          Run Workflow
        </button>
      </div>

      {/* Settings */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl p-6 mb-6 space-y-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Workflow Settings</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-royal"
            />
          </div>
          <div className="flex items-center gap-3 pt-7">
            <div
              className={`relative w-10 h-5 rounded-full cursor-pointer transition-all duration-300 ${isActive ? '' : ''}`}
              style={{
                background: isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.1)',
                boxShadow: isActive ? '0 2px 10px rgba(99,102,241,0.4)' : 'none',
              }}
              onClick={() => setIsActive((v) => !v)}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300"
                style={{ left: isActive ? '22px' : '2px' }}
              />
            </div>
            <label className="text-sm font-medium text-slate-300 cursor-pointer" onClick={() => setIsActive((v) => !v)}>
              {isActive ? 'Active' : 'Inactive'}
            </label>
          </div>
        </div>

        <JsonEditor
          label="Input Schema (JSON)"
          value={inputSchemaStr}
          onChange={setInputSchemaStr}
          placeholder='{"type":"object","properties":{}}'
          rows={4}
        />

        {updateWorkflow.isError && (
          <p className="text-sm text-red-400">{(updateWorkflow.error as Error).message}</p>
        )}
        {updateWorkflow.isSuccess && (
          <p className="text-sm text-emerald-400">Saved successfully.</p>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={!canSave} className="btn-primary px-5 py-2 disabled:opacity-40">
            {updateWorkflow.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Steps panel */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Steps</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Each step is a stage — task, approval, or notification.
                </p>
              </div>
              <button
                onClick={handleAddStep}
                className="btn-primary px-3 py-1.5 text-xs"
              >
                + Add Step
              </button>
            </div>
            {workflow.start_step_id ? (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Starts at:{' '}
                <span className="font-semibold">
                  {steps.find((s) => s.id === workflow.start_step_id)?.name ?? 'Unknown'}
                </span>
              </div>
            ) : steps.length > 0 ? (
              <div
                className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-400 px-2.5 py-1.5 rounded-lg"
                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
              >
                ⚠ No start step — click "Set Start" on a step.
              </div>
            ) : null}
          </div>
          <StepList
            workflowId={workflowId}
            steps={steps}
            selectedStepId={selectedStep?.id ?? null}
            onSelect={setSelectedStep}
            onEdit={handleEditStep}
            startStepId={workflow.start_step_id}
            onSetStartStep={handleSetStartStep}
          />
        </div>

        {/* Rule editor panel */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {selectedStep ? (
            <div>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-sm font-semibold text-slate-200">Routing Rules</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  After <span className="font-semibold text-slate-300">{selectedStep.name}</span> completes,
                  these rules decide what runs next. First match wins.
                </p>
              </div>
              <div className="p-5">
                <RuleEditor step={selectedStep} steps={steps} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-56 text-center px-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                <span className="text-indigo-400 text-xl">→</span>
              </div>
              <p className="text-sm font-semibold text-slate-400">Select a step to set routing rules</p>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Rules decide what happens after a step — which step runs next, or whether the workflow ends.
              </p>
            </div>
          )}
        </div>
      </div>

      {showStepForm && (
        <StepForm workflowId={workflowId} step={editingStep} onClose={handleCloseStepForm} />
      )}
    </div>
  )
}
