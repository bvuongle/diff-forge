import { KeyboardEvent, memo, useEffect, useRef, useState } from 'react'

import { FormControlLabel, Switch, TextField } from '@mui/material'

import { ConfigValueSchema } from '@core/catalog/CatalogTypes'

type ConfigFieldRendererProps = {
  fieldName: string
  schema: ConfigValueSchema
  value: unknown
  onChange: (name: string, value: unknown) => void
}

const NUMERIC_BOUNDS: Record<string, { min?: number; max?: number; step?: string }> = {
  int: { min: -2147483648, max: 2147483647 },
  uint: { min: 0, max: 4294967295 },
  int8: { min: -128, max: 127 },
  uint8: { min: 0, max: 255 },
  int16: { min: -32768, max: 32767 },
  uint16: { min: 0, max: 65535 },
  int32: { min: -2147483648, max: 2147483647 },
  uint32: { min: 0, max: 4294967295 },
  int64: { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER },
  uint64: { min: 0, max: Number.MAX_SAFE_INTEGER },
  float: { step: 'any' },
  double: { step: 'any' }
}

function onEnterKey(e: KeyboardEvent<Element>, commit: () => void) {
  if (e.key === 'Enter') {
    e.preventDefault()
    commit()
  }
}

function useLocalValue(value: unknown, fallback: unknown) {
  const initial = String(value ?? fallback ?? '')
  const [local, setLocal] = useState(initial)
  const focusedRef = useRef(false)
  useEffect(() => {
    if (focusedRef.current) return
    const next = String(value ?? fallback ?? '')
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const bounds = NUMERIC_BOUNDS[schema.type]
  if (bounds) {
    return <NumericField fieldName={fieldName} schema={schema} value={value} bounds={bounds} onChange={onChange} />
  }

  return <TextInputField fieldName={fieldName} schema={schema} value={value} onChange={onChange} />
}

type NumericFieldProps = ConfigFieldRendererProps & {
  bounds: { min?: number; max?: number; step?: string }
}

function NumericField({ fieldName, schema, value, bounds, onChange }: NumericFieldProps) {
  const { local, setLocal, focusedRef } = useLocalValue(value, schema.default)
  const min = schema.min ?? bounds.min
  const max = schema.max ?? bounds.max
  const step = bounds.step ?? '1'

  const commit = () => {
    if (local === '') return
    const num = Number(local)
    if (!Number.isNaN(num)) onChange(fieldName, num)
  }

  return (
    <TextField
      label={fieldName}
      type="number"
      size="small"
      fullWidth
      value={local}
      slotProps={{ htmlInput: { min, max, step } }}
      onFocus={() => {
        focusedRef.current = true
      }}
      onBlur={() => {
        focusedRef.current = false
        commit()
      }}
      onKeyDown={(e) => onEnterKey(e, commit)}
      onChange={(e) => setLocal(e.target.value)}
    />
  )
}

function TextInputField({ fieldName, schema, value, onChange }: ConfigFieldRendererProps) {
  const { local, setLocal, focusedRef } = useLocalValue(value, schema.default)
  const maxLength = schema.max != null ? schema.max : undefined
  const commit = () => onChange(fieldName, local)

  return (
    <TextField
      label={fieldName}
      size="small"
      fullWidth
      value={local}
      slotProps={{ htmlInput: maxLength != null ? { maxLength } : {} }}
      onFocus={() => {
        focusedRef.current = true
      }}
      onBlur={() => {
        focusedRef.current = false
        commit()
      }}
      onKeyDown={(e) => onEnterKey(e, commit)}
      onChange={(e) => setLocal(e.target.value)}
    />
  )
}

const ConfigFieldRenderer = memo(ConfigFieldRendererImpl)

export { ConfigFieldRenderer }
