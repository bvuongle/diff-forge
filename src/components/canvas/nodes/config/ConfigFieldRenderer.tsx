import { ChangeEvent, KeyboardEvent, memo, useEffect, useRef, useState } from 'react'

import { FormControlLabel, Switch, TextField } from '@mui/material'

import { ConfigValueSchema } from '@core/catalog/CatalogSchema'
import { numericBound } from '@core/catalog/configBounds'
import { validateConfigValue } from '@core/catalog/configValidation'

type ConfigFieldRendererProps = {
  fieldName: string
  schema: ConfigValueSchema
  value: unknown
  onChange: (name: string, value: unknown) => void
}

function useLocalValue(value: unknown, fallback: unknown) {
  const initial = String(value ?? fallback ?? '')
  const [local, setLocal] = useState(initial)
  const focusedRef = useRef(false)
  useEffect(() => {
    if (focusedRef.current) return
    const next = String(value ?? fallback ?? '')
    setLocal((prev) => (prev === next ? prev : next))
  }, [value, fallback])
  return { local, setLocal, focusedRef }
}

function ConfigFieldRendererImpl({ fieldName, schema, value, onChange }: ConfigFieldRendererProps) {
  if (schema.type === 'bool') {
    return (
      <FormControlLabel
        label={fieldName}
        className="config-bool-label"
        control={
          <Switch
            size="small"
            checked={Boolean(value ?? schema.default ?? false)}
            onChange={(_, checked) => onChange(fieldName, checked)}
          />
        }
      />
    )
  }

  return <ValidatedField fieldName={fieldName} schema={schema} value={value} onChange={onChange} />
}

function ValidatedField({ fieldName, schema, value, onChange }: ConfigFieldRendererProps) {
  const { local, setLocal, focusedRef } = useLocalValue(value, schema.default)
  const [error, setError] = useState<string | null>(null)
  const touchedRef = useRef(false)

  const bound = numericBound(schema.type)
  const inputMode = bound ? (bound.integer ? 'numeric' : 'decimal') : 'text'

  useEffect(() => {
    if (!focusedRef.current) setError(null)
  }, [value, focusedRef])

  const evaluate = (text: string) => {
    if (text.trim() === '') return { error: null, value: text, commit: !bound }
    const outcome = validateConfigValue(schema, text)
    if (outcome.ok) return { error: null, value: outcome.value, commit: true }
    return { error: outcome.error, value: undefined, commit: false }
  }

  const commit = () => {
    touchedRef.current = true
    const result = evaluate(local)
    setError(result.error)
    if (result.commit) onChange(fieldName, result.value)
  }

  const onChangeText = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setLocal(next)
    if (touchedRef.current) setError(evaluate(next).error)
  }

  return (
    <TextField
      label={fieldName}
      size="small"
      fullWidth
      value={local}
      error={error != null}
      helperText={error ?? undefined}
      slotProps={{ htmlInput: { inputMode } }}
      onFocus={() => {
        focusedRef.current = true
      }}
      onBlur={() => {
        focusedRef.current = false
        commit()
      }}
      onKeyDown={(e: KeyboardEvent<Element>) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
        }
      }}
      onChange={onChangeText}
    />
  )
}

const ConfigFieldRenderer = memo(ConfigFieldRendererImpl)

export { ConfigFieldRenderer }
