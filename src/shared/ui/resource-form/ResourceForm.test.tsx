import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { z } from 'zod'
import { ApiError } from '@/shared/api/errors'
import { ResourceForm } from './ResourceForm'
import type { FieldConfig } from './types'
import { renderWithProviders } from '@/test/utils'

type Values = { name: string }

const schema = z.object({ name: z.string().trim().min(2, '客户名称至少 2 个字') })
const fields: FieldConfig<Values>[] = [
  { kind: 'text', name: 'name', label: '客户名称', required: true },
]

describe('ResourceForm', () => {
  it('空的必填项被 Zod 拦下，且错误定位到字段', async () => {
    const onSubmit = vi.fn()
    renderWithProviders(<ResourceForm schema={schema} fields={fields} onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: /保\s*存/ }))

    expect(await screen.findByText('客户名称至少 2 个字')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('合法输入提交的是 Zod 解析后的值', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(<ResourceForm schema={schema} fields={fields} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('客户名称'), '  远山科技  ')
    await userEvent.click(screen.getByRole('button', { name: /保\s*存/ }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: '远山科技' }))
  })

  it('服务端 422 字段错误回填到表单', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError(422, 'VALIDATION_ERROR', '表单校验失败', { fields: { name: '名称已被占用' } }),
      )
    renderWithProviders(<ResourceForm schema={schema} fields={fields} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('客户名称'), '远山科技')
    await userEvent.click(screen.getByRole('button', { name: /保\s*存/ }))

    expect(await screen.findByText('名称已被占用')).toBeInTheDocument()
    expect(screen.getByText('表单校验失败')).toBeInTheDocument()
  })
})
