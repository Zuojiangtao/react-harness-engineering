import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import LoginPage from './index'

describe('登录页', () => {
  it('空表单提交时用 Zod 文案定位字段', async () => {
    renderWithProviders(<LoginPage />)

    await userEvent.clear(screen.getByLabelText(/邮箱/))
    await userEvent.clear(screen.getByLabelText(/密码/))
    await userEvent.click(screen.getByRole('button', { name: /登\s*录/ }))

    expect(await screen.findByText('请输入邮箱')).toBeInTheDocument()
    expect(screen.getByText('请输入密码')).toBeInTheDocument()
  })
})
