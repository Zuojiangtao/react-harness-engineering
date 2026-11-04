import { expect, test } from '@playwright/test'

test('[CUS-01][CUS-02][CUS-03] 客户创建、编辑清空、删除主流程', async ({ page }) => {
  const name = 'E2E 客户'
  await page.goto('/login')
  await page.getByRole('button', { name: '管理员进入' }).click()
  await expect(page).toHaveURL(/\/customers$/)

  // 创建
  await page.getByRole('button', { name: /新建客户/ }).click()
  await page.getByLabel('客户名称').fill(name)
  await page.getByLabel('行业').click()
  await page.getByRole('option', { name: '科技' }).click()
  await page.getByLabel('等级').click()
  await page.getByRole('option', { name: '重点' }).click()
  await page.getByLabel('状态').click()
  await page.getByRole('option', { name: '合作中' }).click()
  await page.getByLabel('负责人').click()
  await page.getByRole('option', { name: '张伟' }).click()
  // 表单用 requiredMark="optional"，AntD 会给非必填 label 追加“（可选）”
  await page.getByLabel(/手机号/).fill('13900000000')
  await page.getByLabel(/邮箱/).fill('e2e@example.com')
  await page.getByRole('button', { name: '创建' }).click()
  await expect(page.getByText('已创建')).toBeVisible()

  await page.getByPlaceholder('搜索客户名称').fill(name)
  await page.getByPlaceholder('搜索客户名称').press('Enter')
  const row = page.getByRole('row', { name: new RegExp(name) }).first()
  await expect(row).toBeVisible()

  // 编辑：清空可选联系方式
  await row.getByRole('button', { name: /编\s*辑/ }).click()
  await page.getByLabel(/手机号/).clear()
  await page.getByLabel(/邮箱/).clear()
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText('已保存')).toBeVisible()
  await expect(row.getByRole('cell').nth(4)).toHaveText('—')

  // 删除
  await row.getByRole('button', { name: /删\s*除/ }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /删\s*除/ })
    .click()
  await expect(page.getByText('已删除')).toBeVisible()
  await expect(page.getByRole('row', { name: new RegExp(name) })).toHaveCount(0)
})
