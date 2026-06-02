import { useEffect, useState } from 'react'

import { Box, TextField } from '@mui/material'

import type { ConfigValueSchema } from '@core/catalog/CatalogSchema'
import { validateConfig } from '@core/catalog/configValidation'

type JsonConfigurationProps = {
  config: Record<string, unknown>
  schema: Record<string, ConfigValueSchema>
  onSave: (config: Record<string, unknown>) => void
}

function deriveErrors(text: string, schema: Record<string, ConfigValueSchema>): string[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return ['Invalid JSON']
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return ['Invalid JSON']
  return validateConfig(schema, parsed as Record<string, unknown>).map((e) => `${e.field}: ${e.error}`)
}

function JsonConfiguration({ config, schema, onSave }: JsonConfigurationProps) {
  const [text, setText] = useState(() => JSON.stringify(config, null, 2))
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    const next = JSON.stringify(config, null, 2)
    setText(next)
    setErrors(deriveErrors(next, schema))
  }, [config, schema])

  const handleBlur = () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      setErrors(['Invalid JSON'])
      return
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setErrors(['Invalid JSON'])
      return
    }
    const obj = parsed as Record<string, unknown>
    setErrors(deriveErrors(text, schema))
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
      error={errors.length > 0}
      helperText={
        errors.length > 0 ? (
          <Box component="span" className="json-editor__errors">
            {errors.map((message) => (
              <Box component="span" key={message} className="json-editor__error">
                {message}
              </Box>
            ))}
          </Box>
        ) : undefined
      }
      className="json-editor"
    />
  )
}

export { JsonConfiguration }
