import { FormControlLabel, Switch, TextField } from '@mui/material'
import { ConfigValueSchema } from '@domain/catalog/CatalogTypes'

type ConfigFieldRendererProps = {
  fieldName: string
  schema: ConfigValueSchema
  value: unknown
  onChange: (name: string, value: unknown) => void
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

  if (schema.type === 'int' || schema.type === 'uint') {
    const min = schema.type === 'uint' ? Math.max(0, schema.min ?? 0) : schema.min
    return (
      <TextField
        label={fieldName}
        type="number"
        size="small"
        fullWidth
        value={value ?? schema.default ?? ''}
        slotProps={{ htmlInput: { min, max: schema.max } }}
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
