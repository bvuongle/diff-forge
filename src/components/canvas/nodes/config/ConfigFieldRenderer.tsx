import { FormControlLabel, Switch, TextField } from '@mui/material'

import { ConfigValueSchema } from '@domain/catalog/CatalogTypes'

type ConfigFieldRendererProps = {
  fieldName: string
  schema: ConfigValueSchema
  value: unknown
  onChange: (name: string, value: unknown) => void
}

const NUMERIC_BOUNDS: Record<string, { min?: number; max?: number; step?: string }> = {
  int: {},
  uint: { min: 0 },
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

function ConfigFieldRenderer({ fieldName, schema, value, onChange }: ConfigFieldRendererProps) {
  if (schema.type === 'bool') {
    return (
      <FormControlLabel
        label={fieldName}
        sx={{ ml: 0, '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
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
    const min = schema.min ?? bounds.min
    const max = schema.max ?? bounds.max
    const step = bounds.step ?? '1'
    return (
      <TextField
        label={fieldName}
        type="number"
        size="small"
        fullWidth
        value={value ?? schema.default ?? ''}
        slotProps={{ htmlInput: { min, max, step } }}
        onChange={(e) => {
          const num = Number(e.target.value)
          if (!Number.isNaN(num)) onChange(fieldName, num)
        }}
      />
    )
  }

  return (
    <TextField
      label={fieldName}
      size="small"
      fullWidth
      value={String(value ?? schema.default ?? '')}
      slotProps={{ htmlInput: schema.max != null ? { maxLength: schema.max } : {} }}
      onChange={(e) => onChange(fieldName, e.target.value)}
    />
  )
}

export { ConfigFieldRenderer }
