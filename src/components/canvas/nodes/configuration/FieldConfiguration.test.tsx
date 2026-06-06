import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ConfigValueSchema } from '@core/catalog/CatalogSchema'
import { renderWithTheme } from '@testing/test-utils'

import { FieldConfiguration } from './FieldConfiguration'

const one = (schema: ConfigValueSchema): Record<string, ConfigValueSchema> => ({ field: schema })

describe('FieldConfiguration', () => {
  it('renders one control per schema entry', () => {
    renderWithTheme(
      <FieldConfiguration
        config={{ count: 5, content: 'hi' }}
        schema={{ count: { type: 'int' }, content: { type: 'string' } }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByLabelText('count')).toBeInTheDocument()
    expect(screen.getByLabelText('content')).toBeInTheDocument()
  })

  describe('string type', () => {
    it('renders text input seeded from config', () => {
      renderWithTheme(
        <FieldConfiguration config={{ field: 'hello' }} schema={one({ type: 'string' })} onChange={vi.fn()} />
      )
      expect((screen.getByLabelText('field') as HTMLInputElement).value).toBe('hello')
    })

    it('fires onChange with string value on blur', () => {
      const onChange = vi.fn()
      renderWithTheme(
        <FieldConfiguration config={{ field: '' }} schema={one({ type: 'string' })} onChange={onChange} />
      )
      const input = screen.getByLabelText('field')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'world' } })
      expect(onChange).not.toHaveBeenCalled()
      fireEvent.blur(input)
      expect(onChange).toHaveBeenCalledWith('field', 'world')
    })

    it('uses default when value is undefined', () => {
      renderWithTheme(
        <FieldConfiguration config={{}} schema={one({ type: 'string', default: 'fallback' })} onChange={vi.fn()} />
      )
      expect((screen.getByLabelText('field') as HTMLInputElement).value).toBe('fallback')
    })
  })

  describe('bool type', () => {
    it('renders a switch reflecting the value', () => {
      renderWithTheme(<FieldConfiguration config={{ field: true }} schema={one({ type: 'bool' })} onChange={vi.fn()} />)
      expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true)
    })

    it('fires onChange with boolean value on toggle', () => {
      const onChange = vi.fn()
      renderWithTheme(
        <FieldConfiguration config={{ field: true }} schema={one({ type: 'bool' })} onChange={onChange} />
      )
      fireEvent.click(screen.getByRole('switch'))
      expect(onChange).toHaveBeenCalledWith('field', false)
    })

    it('uses schema default when value is undefined', () => {
      renderWithTheme(
        <FieldConfiguration config={{}} schema={one({ type: 'bool', default: true })} onChange={vi.fn()} />
      )
      expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true)
    })
  })

  describe('numeric type', () => {
    it('renders a text input (not a native number input)', () => {
      renderWithTheme(<FieldConfiguration config={{ field: 5 }} schema={one({ type: 'int' })} onChange={vi.fn()} />)
      const input = screen.getByLabelText('field') as HTMLInputElement
      expect(input.type).toBe('text')
      expect(input.value).toBe('5')
    })

    it('commits a numeric value on blur', () => {
      const onChange = vi.fn()
      renderWithTheme(<FieldConfiguration config={{ field: 5 }} schema={one({ type: 'int' })} onChange={onChange} />)
      const input = screen.getByLabelText('field')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '10' } })
      fireEvent.blur(input)
      expect(onChange).toHaveBeenCalledWith('field', 10)
    })

    it('commits on Enter key', () => {
      const onChange = vi.fn()
      renderWithTheme(<FieldConfiguration config={{ field: 5 }} schema={one({ type: 'int' })} onChange={onChange} />)
      const input = screen.getByLabelText('field')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '42' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onChange).toHaveBeenCalledWith('field', 42)
    })

    it('commits the raw text but flags non-numeric input', () => {
      const onChange = vi.fn()
      renderWithTheme(<FieldConfiguration config={{ field: 5 }} schema={one({ type: 'int' })} onChange={onChange} />)
      const input = screen.getByLabelText('field')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'abc' } })
      fireEvent.blur(input)
      expect(onChange).toHaveBeenCalledWith('field', 'abc')
      expect(screen.getByText('Must be a number')).toBeInTheDocument()
    })

    it('commits the number but flags out-of-range against the C++ type range', () => {
      const onChange = vi.fn()
      renderWithTheme(<FieldConfiguration config={{ field: 50 }} schema={one({ type: 'uint8' })} onChange={onChange} />)
      const input = screen.getByLabelText('field')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '300' } })
      fireEvent.blur(input)
      expect(onChange).toHaveBeenCalledWith('field', 300)
      expect(screen.getByText('Must be between 0 and 255')).toBeInTheDocument()
    })

    it('commits the number but flags a decimal in an integer field', () => {
      const onChange = vi.fn()
      renderWithTheme(<FieldConfiguration config={{ field: 5 }} schema={one({ type: 'int' })} onChange={onChange} />)
      const input = screen.getByLabelText('field')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '1.5' } })
      fireEvent.blur(input)
      expect(onChange).toHaveBeenCalledWith('field', 1.5)
      expect(screen.getByText('Must be an integer')).toBeInTheDocument()
    })
  })

  describe('validation feedback', () => {
    it('shows the error as soon as the value is invalid', () => {
      renderWithTheme(<FieldConfiguration config={{ field: 5 }} schema={one({ type: 'int' })} onChange={vi.fn()} />)
      const input = screen.getByLabelText('field')
      fireEvent.change(input, { target: { value: 'abc' } })
      expect(screen.getByText('Must be a number')).toBeInTheDocument()
    })

    it('clears the error when the value becomes valid again', () => {
      renderWithTheme(<FieldConfiguration config={{ field: 5 }} schema={one({ type: 'int' })} onChange={vi.fn()} />)
      const input = screen.getByLabelText('field')
      fireEvent.change(input, { target: { value: 'abc' } })
      expect(screen.getByText('Must be a number')).toBeInTheDocument()
      fireEvent.change(input, { target: { value: '12' } })
      expect(screen.queryByText('Must be a number')).toBeNull()
    })
  })
})
