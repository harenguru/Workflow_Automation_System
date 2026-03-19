import { useState, useEffect } from 'react'

export function isValidJson(value: string): boolean {
  if (value.trim() === '') return true
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  rows?: number
}

export default function JsonEditor({ value, onChange, label, placeholder, rows = 6 }: JsonEditorProps) {
  const [touched, setTouched] = useState(false)
  const invalid = touched && value.trim() !== '' && !isValidJson(value)

  useEffect(() => {
    if (value === '') setTouched(false)
  }, [value])

  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      )}
      <textarea
        value={value}
        onChange={(e) => {
          setTouched(true)
          onChange(e.target.value)
        }}
        rows={rows}
        placeholder={placeholder ?? '{}'}
        className="input-royal font-mono resize-y"
        style={{
          borderColor: invalid ? 'rgba(239,68,68,0.5)' : undefined,
        }}
      />
      {invalid && (
        <p className="mt-1 text-xs text-red-400">Invalid JSON</p>
      )}
    </div>
  )
}
