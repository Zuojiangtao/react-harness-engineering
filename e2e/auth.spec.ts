import { expect, test } from '@playwright/test'

test('[AUTH-01] 管理员登录后进入客户列表', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: '管理员进入' }).click()

  await expect(page).toHaveURL(/\/customers$/)
  await expect(page.getByText('共 24 条')).toBeVisible()
  await expect(page.getByText('原点设计')).toBeVisible()
})

test('[AUTH-02] 只读账号看不到写入口', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: '只读账号进入' }).click()

  await expect(page).toHaveURL(/\/customers$/)
  await expect(page.getByText('共 24 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '新建客户' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '删除' })).toHaveCount(0)
})
