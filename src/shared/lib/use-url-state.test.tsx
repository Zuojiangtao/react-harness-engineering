import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { z } from 'zod'
import { useUrlState } from './use-url-state'
import { renderWithProviders } from '@/test/utils'

const schema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  level: z.enum(['key', 'normal', 'potential']).optional(),
})
const defaults = { page: 1, level: undefined }

function Probe() {
  const [state, update] = useUrlState(schema, defaults)
  const location = useLocation()
  return (
    <div>
      <span data-testid="page">{state.page}</span>
      <span data-testid="level">{state.level ?? 'none'}</span>
      <span data-testid="search">{location.search}</span>
      <button onClick={() => update({ page: 3 })}>下一页</button>
    </div>
  )
}

describe('useUrlState', () => {
  it('从 URL 还原状态并忽略非法参数', () => {
    renderWithProviders(<Probe />, { route: '/customers?page=2&level=key&bogus=1' })
    expect(screen.getByTestId('page')).toHaveTextContent('2')
    expect(screen.getByTestId('level')).toHaveTextContent('key')
  })

  it('非法分页参数回落到默认值', () => {
    renderWithProviders(<Probe />, { route: '/customers?page=abc' })
    expect(screen.getByTestId('page')).toHaveTextContent('1')
  })

  it('更新写入 URL，默认值不写入', async () => {
    renderWithProviders(<Probe />, { route: '/customers' })
    await userEvent.click(screen.getByRole('button', { name: '下一页' }))
    expect(screen.getByTestId('search')).toHaveTextContent('?page=3')
  })
})
