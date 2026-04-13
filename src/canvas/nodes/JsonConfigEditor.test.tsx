import { fireEvent, screen } from '@testing-library/react'
import { renderWithTheme } from '@testing/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { JsonConfigEditor } from './JsonConfigEditor'

describe('JsonConfigEditor', () => {
  it('renders textarea with JSON content', () => {
    const config = { count: 3, content: 'hello' }
    renderWithTheme(<JsonConfigEditor config={config} onSave={vi.fn()} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe(JSON.stringify(config, null, 2))
  })

  it('calls onSave with parsed JSON on blur', () => {
    const onSave = vi.fn()
    renderWithTheme(<JsonConfigEditor config={{ a: 1 }} onSave={onSave} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '{"a":2}' } })
    fireEvent.blur(textarea)
    expect(onSave).toHaveBeenCalledWith({ a: 2 })
  })

  it('shows error on invalid JSON blur', () => {
    const onSave = vi.fn()
    renderWithTheme(<JsonConfigEditor config={{}} onSave={onSave} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '{invalid' } })
    fireEvent.blur(textarea)
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Invalid JSON')).toBeTruthy()
  })

  it('clears error state when config prop changes', () => {
    const onSave = vi.fn()
    const { rerender } = renderWithTheme(<JsonConfigEditor config={{}} onSave={onSave} />)
    const textarea = screen.getByRole('textbox')
    // Make it invalid
    fireEvent.change(textarea, { target: { value: '{bad' } })
    fireEvent.blur(textarea)
    expect(screen.getByText('Invalid JSON')).toBeTruthy()
    // Rerender with new config
    rerender(<JsonConfigEditor config={{ newKey: 'val' }} onSave={onSave} />)
    expect(screen.queryByText('Invalid JSON')).toBeNull()
  })

  it('renders empty object config', () => {
    renderWithTheme(<JsonConfigEditor config={{}} onSave={vi.fn()} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('{}')
  })
})
