import { ChangeEvent, KeyboardEvent, memo, useEffect, useRef, useState } from 'react'

import { Box, FormControlLabel, Switch, TextField } from '@mui/material'

import { ConfigValueSchema } from '@core/catalog/CatalogSchema'
import { numericBound } from '@core/catalog/configBounds'
import { validateConfigValue } from '@core/catalog/configValidation'

type FieldConfigurationProps = {
  config: Record<string, unknown>
  schema: Record<string, ConfigValueSchema>
  onChange: (name: string, value: unknown) => void
}

function FieldConfiguration({ config, schema, onChange }: FieldConfigurationProps) {
  return (
    <Box display="flex" flexDirection="column" gap={1.5} marginTop={1}>
      {Object.entries(schema).map(([name, fieldSchema]) => (
        <ConfigField key={name} fieldName={name} schema={fieldSchema} value={config[name]} onChange={onChange} />
      ))}
    </Box>
  )
}

type ConfigFieldProps = {
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

function ConfigFieldImpl({ fieldName, schema, value, onChange }: ConfigFieldProps) {
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

function ValidatedField({ fieldName, schema, value, onChange }: ConfigFieldProps) {
  const { local, setLocal, focusedRef } = useLocalValue(value, schema.default)

  const bound = numericBound(schema.type)
  const inputMode = bound ? (bound.integer ? 'numeric' : 'decimal') : 'text'

  const result = validateConfigValue(schema, local)
  const error = result.ok ? null : result.error

  const commit = () => onChange(fieldName, result.ok ? result.value : parseRaw(local, bound != null))

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
      onChange={(e: ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)}
    />
  )
}

function parseRaw(text: string, numeric: boolean): unknown {
  if (!numeric) return text
  const trimmed = text.trim()
  const num = Number(trimmed)
  return trimmed !== '' && Number.isFinite(num) ? num : text
}

const ConfigField = memo(ConfigFieldImpl)

export { FieldConfiguration }
