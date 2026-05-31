import { useEffect, useState } from 'react'

import { TextField } from '@mui/material'

import type { ConfigValueSchema } from '@core/catalog/CatalogSchema'
import { validateConfig } from '@core/catalog/configValidation'

type JsonConfigurationProps = {
  config: Record<string, unknown>
  schema: Record<string, ConfigValueSchema>
  onSave: (config: Record<string, unknown>) => void
}

function deriveError(text: string, schema: Record<string, ConfigValueSchema>): string | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return 'Invalid JSON'
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return 'Invalid JSON'
  const errors = validateConfig(schema, parsed as Record<string, unknown>)
  return errors.length > 0 ? errors.map((e) => `${e.field}: ${e.error}`).join('; ') : null
}

function JsonConfiguration({ config, schema, onSave }: JsonConfigurationProps) {
  const [text, setText] = useState(() => JSON.stringify(config, null, 2))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const next = JSON.stringify(config, null, 2)
    setText(next)
    setError(deriveError(next, schema))
  }, [config, schema])

  const handleBlur = () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      setError('Invalid JSON')
      return
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setError('Invalid JSON')
      return
    }
    const obj = parsed as Record<string, unknown>
    setError(deriveError(text, schema))
    onSave(obj)
  }

  return (
    <TextField
      multiline
      fullWidth
      minRows={3}
      maxRows={10}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      error={error != null}
      helperText={error ?? undefined}
      className="json-editor"
    />
  )
}

export { JsonConfiguration }
