import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@testing/test-utils'

import { ConfigFieldRenderer } from './ConfigFieldRenderer'

describe('ConfigFieldRenderer', () => {
  describe('string type', () => {
    it('renders text input with field name as label', () => {
      const onChange = vi.fn()
      renderWithTheme(
        <ConfigFieldRenderer fieldName="content" schema={{ type: 'string' }} value="hello" onChange={onChange} />
      )
      const input = screen.getByLabelText('content') as HTMLInputElement
      expect(input.value).toBe('hello')
    })

    it('fires onChange with string value on blur', () => {
      const onChange = vi.fn()
      renderWithTheme(
        <ConfigFieldRenderer fieldName="content" schema={{ type: 'string' }} value="" onChange={onChange} />
      )
      const input = screen.getByLabelText('content')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'world' } })
      expect(onChange).not.toHaveBeenCalled()
      fireEvent.blur(input)
      expect(onChange).toHaveBeenCalledWith('content', 'world')
    })

    it('uses default when value is undefined', () => {
      renderWithTheme(
        <ConfigFieldRenderer
          fieldName="content"
          schema={{ type: 'string', default: 'fallback' }}
          value={undefined}
          onChange={vi.fn()}
        />
      )
      const input = screen.getByLabelText('content') as HTMLInputElement
      expect(input.value).toBe('fallback')
    })
  })

  describe('bool type', () => {
    it('renders a switch with field name label', () => {
      renderWithTheme(
        <ConfigFieldRenderer fieldName="enabled" schema={{ type: 'bool' }} value={true} onChange={vi.fn()} />
      )
      expect(screen.getByText('enabled')).toBeTruthy()
      const toggle = screen.getByRole('switch') as HTMLInputElement
      expect(toggle.checked).toBe(true)
    })

    it('fires onChange with boolean value on toggle', () => {
      const onChange = vi.fn()
      renderWithTheme(
        <ConfigFieldRenderer fieldName="enabled" schema={{ type: 'bool' }} value={true} onChange={onChange} />
      )
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      expect(onChange).toHaveBeenCalledWith('enabled', false)
    })

    it('defaults to false when value and default are undefined', () => {
      renderWithTheme(
        <ConfigFieldRenderer fieldName="enabled" schema={{ type: 'bool' }} value={undefined} onChange={vi.fn()} />
      )
      const toggle = screen.getByRole('switch') as HTMLInputElement
      expect(toggle.checked).toBe(false)
    })

    it('uses schema default when value is undefined', () => {
      renderWithTheme(
        <ConfigFieldRenderer
          fieldName="enabled"
          schema={{ type: 'bool', default: true }}
          value={undefined}
          onChange={vi.fn()}
        />
      )
      const toggle = screen.getByRole('switch') as HTMLInputElement
      expect(toggle.checked).toBe(true)
    })
  })

  describe('numeric type', () => {
    it('renders a text input (not a native number input)', () => {
      renderWithTheme(<ConfigFieldRenderer fieldName="count" schema={{ type: 'int' }} value={5} onChange={vi.fn()} />)
      const input = screen.getByLabelText('count') as HTMLInputElement
      expect(input.type).toBe('text')
      expect(input.value).toBe('5')
    })

    it('commits a numeric value on blur', () => {
      const onChange = vi.fn()
      renderWithTheme(<ConfigFieldRenderer fieldName="count" schema={{ type: 'int' }} value={5} onChange={onChange} />)
      const input = screen.getByLabelText('count')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '10' } })
      expect(onChange).not.toHaveBeenCalled()
      fireEvent.blur(input)
      expect(onChange).toHaveBeenCalledWith('count', 10)
    })

    it('commits on Enter key', () => {
      const onChange = vi.fn()
      renderWithTheme(<ConfigFieldRenderer fieldName="count" schema={{ type: 'int' }} value={5} onChange={onChange} />)
      const input = screen.getByLabelText('count')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '42' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onChange).toHaveBeenCalledWith('count', 42)
    })

    it('flags non-numeric input and does not commit', () => {
      const onChange = vi.fn()
      renderWithTheme(<ConfigFieldRenderer fieldName="count" schema={{ type: 'int' }} value={5} onChange={onChange} />)
      const input = screen.getByLabelText('count')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'abc' } })
      fireEvent.blur(input)
      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getByText('Must be a number')).toBeInTheDocument()
    })

    it('flags an out-of-range value against the C++ type range', () => {
      const onChange = vi.fn()
      renderWithTheme(
        <ConfigFieldRenderer fieldName="reliability" schema={{ type: 'uint8' }} value={50} onChange={onChange} />
      )
      const input = screen.getByLabelText('reliability')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '300' } })
      fireEvent.blur(input)
      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getByText('Must be between 0 and 255')).toBeInTheDocument()
    })

    it('flags a decimal in an integer field', () => {
      const onChange = vi.fn()
      renderWithTheme(<ConfigFieldRenderer fieldName="count" schema={{ type: 'int' }} value={5} onChange={onChange} />)
      const input = screen.getByLabelText('count')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '1.5' } })
      fireEvent.blur(input)
      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getByText('Must be an integer')).toBeInTheDocument()
    })

    it('respects a schema-tightened range', () => {
      const onChange = vi.fn()
      renderWithTheme(
        <ConfigFieldRenderer
          fieldName="port"
          schema={{ type: 'uint', min: 1, max: 65535 }}
          value={8080}
          onChange={onChange}
        />
      )
      const input = screen.getByLabelText('port')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '70000' } })
      fireEvent.blur(input)
      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getByText('Must be between 1 and 65535')).toBeInTheDocument()
    })
  })

  describe('live-after-first-blur', () => {
    it('stays silent while typing before the first blur, then validates live', () => {
      const onChange = vi.fn()
      renderWithTheme(<ConfigFieldRenderer fieldName="count" schema={{ type: 'int' }} value={5} onChange={onChange} />)
      const input = screen.getByLabelText('count')

      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'abc' } })
      expect(screen.queryByText('Must be a number')).toBeNull()

      fireEvent.blur(input)
      expect(screen.getByText('Must be a number')).toBeInTheDocument()

      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '12' } })
      expect(screen.queryByText('Must be a number')).toBeNull()
    })
  })
})
