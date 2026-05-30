import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@testing/test-utils'

import { JsonConfiguration } from './JsonConfiguration'

describe('JsonConfiguration', () => {
  it('renders textarea with JSON content', () => {
    const config = { count: 3, content: 'hello' }
    renderWithTheme(<JsonConfiguration config={config} onSave={vi.fn()} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe(JSON.stringify(config, null, 2))
  })

  it('calls onSave with parsed JSON on blur', () => {
    const onSave = vi.fn()
    renderWithTheme(<JsonConfiguration config={{ a: 1 }} onSave={onSave} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '{"a":2}' } })
    fireEvent.blur(textarea)
    expect(onSave).toHaveBeenCalledWith({ a: 2 })
  })

  it('shows error on invalid JSON blur', () => {
    const onSave = vi.fn()
    renderWithTheme(<JsonConfiguration config={{}} onSave={onSave} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '{invalid' } })
    fireEvent.blur(textarea)
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Invalid JSON')).toBeTruthy()
  })

  it('clears error state when config prop changes', () => {
    const onSave = vi.fn()
    const { rerender } = renderWithTheme(<JsonConfiguration config={{}} onSave={onSave} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '{bad' } })
    fireEvent.blur(textarea)
    expect(screen.getByText('Invalid JSON')).toBeTruthy()
    rerender(<JsonConfiguration config={{ newKey: 'val' }} onSave={onSave} />)
    expect(screen.queryByText('Invalid JSON')).toBeNull()
  })

  it('renders empty object config', () => {
    renderWithTheme(<JsonConfiguration config={{}} onSave={vi.fn()} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('{}')
  })
})
