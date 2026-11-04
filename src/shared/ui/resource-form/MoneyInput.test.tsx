import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MoneyInput } from './MoneyInput'

describe('MoneyInput', () => {
  it('按元输入，按分回调；清空时回调 undefined', () => {
    const onChange = vi.fn()
    render(<MoneyInput value={123456} onChange={onChange} />)

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '12.34' } })
    expect(onChange).toHaveBeenCalledWith(1234)

    fireEvent.change(input, { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith(undefined)
  })
})
