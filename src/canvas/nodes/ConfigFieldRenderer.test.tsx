import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { ConfigFieldRenderer } from './ConfigFieldRenderer'
import { renderWithTheme } from '@testing/test-utils'

describe('ConfigFieldRenderer', () => {
  describe('string type', () => {
    it('renders text input with field name as label', () => {
      const onChange = vi.fn()
      renderWithTheme(
        <ConfigFieldRenderer
          fieldName="content"
          schema={{ type: 'string' }}
          value="hello"
          onChange={onChange}
        />
      )
      const input = screen.getByLabelText('content') as HTMLInputElement
      expect(input.value).toBe('hello')
    })

    it('fires onChange with string value', () => {
      const onChange = vi.fn()
      renderWithTheme(
        <ConfigFieldRenderer
          fieldName="content"
          schema={{ type: 'string' }}
          value=""
          onChange={onChange}
        />
      )
      const input = screen.getByLabelText('content')
      fireEvent.change(input, { target: { value: 'world' } })
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
        <ConfigFieldRenderer
          fieldName="enabled"
          schema={{ type: 'bool' }}
          value={true}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByText('enabled')).toBeTruthy()
      const toggle = screen.getByRole('switch') as HTMLInputElement
      expect(toggle.checked).toBe(true)
    })

    it('fires onChange with boolean value on toggle', () => {
      const onChange = vi.fn()
      renderWithTheme(
        <ConfigFieldRenderer
          fieldName="enabled"
          schema={{ type: 'bool' }}
          value={true}
          onChange={onChange}
        />
      )
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      expect(onChange).toHaveBeenCalledWith('enabled', false)
    })

    it('defaults to false when value and default are undefined', () => {
      renderWithTheme(
        <ConfigFieldRenderer
          fieldName="enabled"
          schema={{ type: 'bool' }}
          value={undefined}
          onChange={vi.fn()}
        />
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

  describe('int type', () => {
    it('renders number input', () => {
      renderWithTheme(
        <ConfigFieldRenderer
          fieldName="count"
          schema={{ type: 'int' }}
          value={5}
          onChange={vi.fn()}
        />
      )
      const input = screen.getByLabelText('count') as HTMLInputElement
      expect(input.type).toBe('number')
      expect(input.value).toBe('5')
    })

    it('fires onChange with numeric value', () => {
      const onChange = vi.fn()
      renderWithTheme(
        <ConfigFieldRenderer
          fieldName="count"
          schema={{ type: 'int' }}
          value={5}
          onChange={onChange}
        />
      )
      const input = screen.getByLabelText('count')
      fireEvent.change(input, { target: { value: '10' } })
      expect(onChange).toHaveBeenCalledWith('count', 10)
    })

    it('treats non-numeric input as 0 (jsdom coerces type=number empty to 0)', () => {
      const onChange = vi.fn()
      renderWithTheme(
        <ConfigFieldRenderer
          fieldName="count"
          schema={{ type: 'int' }}
          value={5}
          onChange={onChange}
        />
      )
      const input = screen.getByLabelText('count')
      fireEvent.change(input, { target: { value: 'abc' } })
      expect(onChange).toHaveBeenCalledWith('count', 0)
    })
  })

  describe('uint type', () => {
    it('renders number input with min >= 0', () => {
      renderWithTheme(
        <ConfigFieldRenderer
          fieldName="port"
          schema={{ type: 'uint' }}
          value={0}
          onChange={vi.fn()}
        />
      )
      const input = screen.getByLabelText('port') as HTMLInputElement
      expect(input.type).toBe('number')
      expect(input.min).toBe('0')
    })

    it('applies schema min and max to input', () => {
      renderWithTheme(
        <ConfigFieldRenderer
          fieldName="port"
          schema={{ type: 'uint', min: 1, max: 65535 }}
          value={8080}
          onChange={vi.fn()}
        />
      )
      const input = screen.getByLabelText('port') as HTMLInputElement
      expect(input.min).toBe('1')
      expect(input.max).toBe('65535')
    })
  })
})
