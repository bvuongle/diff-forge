import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ConfigValueSchema } from '@core/catalog/CatalogSchema'
import { renderWithTheme } from '@testing/test-utils'

import { JsonConfiguration } from './JsonConfiguration'

const schema: Record<string, ConfigValueSchema> = {
  count: { type: 'uint8', min: 0, max: 100 },
  content: { type: 'string' }
}

describe('JsonConfiguration', () => {
  it('renders textarea with JSON content', () => {
    const config = { count: 3, content: 'hello' }
    renderWithTheme(<JsonConfiguration config={config} schema={schema} onSave={vi.fn()} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe(JSON.stringify(config, null, 2))
  })

  it('calls onSave with parsed JSON on blur when values are valid', () => {
    const onSave = vi.fn()
    renderWithTheme(<JsonConfiguration config={{ count: 1 }} schema={schema} onSave={onSave} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '{"count":2}' } })
    fireEvent.blur(textarea)
    expect(onSave).toHaveBeenCalledWith({ count: 2 })
  })

  it('shows error on invalid JSON blur', () => {
    const onSave = vi.fn()
    renderWithTheme(<JsonConfiguration config={{}} schema={schema} onSave={onSave} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '{invalid' } })
    fireEvent.blur(textarea)
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Invalid JSON')).toBeTruthy()
  })

  it('saves an out-of-range value but flags it (export is the gate)', () => {
    const onSave = vi.fn()
    renderWithTheme(<JsonConfiguration config={{ count: 1 }} schema={schema} onSave={onSave} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '{"count":300}' } })
    fireEvent.blur(textarea)
    expect(onSave).toHaveBeenCalledWith({ count: 300 })
    expect(screen.getByText(/count: Must be between 0 and 100/)).toBeTruthy()
  })

  it('saves but flags a wrong-typed value and an unknown field', () => {
    const onSave = vi.fn()
    renderWithTheme(<JsonConfiguration config={{ count: 1 }} schema={schema} onSave={onSave} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '{"count":"abc","extra":1}' } })
    fireEvent.blur(textarea)
    expect(onSave).toHaveBeenCalledWith({ count: 'abc', extra: 1 })
    expect(screen.getByText(/count: Must be a number/)).toBeTruthy()
    expect(screen.getByText(/extra: Unknown field/)).toBeTruthy()
  })

  it('clears error state when config prop changes', () => {
    const onSave = vi.fn()
    const { rerender } = renderWithTheme(<JsonConfiguration config={{}} schema={schema} onSave={onSave} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '{bad' } })
    fireEvent.blur(textarea)
    expect(screen.getByText('Invalid JSON')).toBeTruthy()
    rerender(<JsonConfiguration config={{ count: 5 }} schema={schema} onSave={onSave} />)
    expect(screen.queryByText('Invalid JSON')).toBeNull()
  })

  it('renders empty object config', () => {
    renderWithTheme(<JsonConfiguration config={{}} schema={schema} onSave={vi.fn()} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('{}')
  })
})
