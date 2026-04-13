import { useState, useEffect } from 'react'
import { TextField } from '@mui/material'

type JsonConfigEditorProps = {
  config: Record<string, unknown>
  onSave: (config: Record<string, unknown>) => void
}

function JsonConfigEditor({ config, onSave }: JsonConfigEditorProps) {
  const [text, setText] = useState(() => JSON.stringify(config, null, 2))
  const [error, setError] = useState(false)

  useEffect(() => {
    setText(JSON.stringify(config, null, 2))
    setError(false)
  }, [config])

  const handleBlur = () => {
    try {
      const parsed: unknown = JSON.parse(text)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setError(true)
        return
      }
      setError(false)
      onSave(parsed as Record<string, unknown>)
    } catch {
      setError(true)
    }
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
      error={error}
      helperText={error ? 'Invalid JSON' : undefined}
      slotProps={{
        input: { sx: { fontFamily: 'monospace', fontSize: '0.75rem' } }
      }}
    />
  )
}

export { JsonConfigEditor }
