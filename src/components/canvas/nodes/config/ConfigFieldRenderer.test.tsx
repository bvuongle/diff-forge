import { fireEvent, screen } from '@testing-library/react'
import { renderWithTheme } from '@testing/test-utils'
import { describe, expect, it, vi } from 'vitest'

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

    it('fires onChange with string value', () => {
      const onChange = vi.fn()
      renderWithTheme(
        <ConfigFieldRenderer fieldName="content" schema={{ type: 'string' }} value="" onChange={onChange} />
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

  describe('int type', () => {
    it('renders number input', () => {
      renderWithTheme(<ConfigFieldRenderer fieldName="count" schema={{ type: 'int' }} value={5} onChange={vi.fn()} />)
      const input = screen.getByLabelText('count') as HTMLInputElement
      expect(input.type).toBe('number')
      expect(input.value).toBe('5')
    })

    it('fires onChange with numeric value', () => {
      const onChange = vi.fn()
      renderWithTheme(<ConfigFieldRenderer fieldName="count" schema={{ type: 'int' }} value={5} onChange={onChange} />)
      const input = screen.getByLabelText('count')
      fireEvent.change(input, { target: { value: '10' } })
      expect(onChange).toHaveBeenCalledWith('count', 10)
    })

    it('treats non-numeric input as 0 (jsdom coerces type=number empty to 0)', () => {
      const onChange = vi.fn()
      renderWithTheme(<ConfigFieldRenderer fieldName="count" schema={{ type: 'int' }} value={5} onChange={onChange} />)
      const input = screen.getByLabelText('count')
      fireEvent.change(input, { target: { value: 'abc' } })
      expect(onChange).toHaveBeenCalledWith('count', 0)
    })
  })

  describe('uint type', () => {
    it('renders number input with uint32 bounds', () => {
      renderWithTheme(<ConfigFieldRenderer fieldName="port" schema={{ type: 'uint' }} value={0} onChange={vi.fn()} />)
      const input = screen.getByLabelText('port') as HTMLInputElement
      expect(input.type).toBe('number')
      expect(input.min).toBe('0')
      expect(input.max).toBe('4294967295')
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

  describe('uint8 type', () => {
    it('renders number input with uint8 bounds', () => {
      renderWithTheme(
        <ConfigFieldRenderer fieldName="reliability" schema={{ type: 'uint8' }} value={95} onChange={vi.fn()} />
      )
      const input = screen.getByLabelText('reliability') as HTMLInputElement
      expect(input.type).toBe('number')
      expect(input.min).toBe('0')
      expect(input.max).toBe('255')
    })

    it('schema min/max overrides type defaults', () => {
      renderWithTheme(
        <ConfigFieldRenderer
          fieldName="reliability"
          schema={{ type: 'uint8', min: 10, max: 100 }}
          value={50}
          onChange={vi.fn()}
        />
      )
      const input = screen.getByLabelText('reliability') as HTMLInputElement
      expect(input.min).toBe('10')
      expect(input.max).toBe('100')
    })
  })

  describe('int16 type', () => {
    it('renders number input with int16 bounds', () => {
      renderWithTheme(
        <ConfigFieldRenderer fieldName="offset" schema={{ type: 'int16' }} value={0} onChange={vi.fn()} />
      )
      const input = screen.getByLabelText('offset') as HTMLInputElement
      expect(input.min).toBe('-32768')
      expect(input.max).toBe('32767')
    })
  })

  describe('float type', () => {
    it('renders number input with step=any', () => {
      renderWithTheme(
        <ConfigFieldRenderer fieldName="threshold" schema={{ type: 'float' }} value={1.5} onChange={vi.fn()} />
      )
      const input = screen.getByLabelText('threshold') as HTMLInputElement
      expect(input.type).toBe('number')
      expect(input.step).toBe('any')
    })
  })

  describe('double type', () => {
    it('renders number input with step=any', () => {
      renderWithTheme(
        <ConfigFieldRenderer fieldName="precision" schema={{ type: 'double' }} value={3.14} onChange={vi.fn()} />
      )
      const input = screen.getByLabelText('precision') as HTMLInputElement
      expect(input.step).toBe('any')
    })
  })
})
