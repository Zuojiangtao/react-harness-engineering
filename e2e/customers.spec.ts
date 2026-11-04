import { expect, test } from '@playwright/test'

test('[CUS-01][CUS-02][CUS-03] 客户创建、编辑清空、删除主流程', async ({ page }) => {
  const name = 'E2E 客户'
  await page.goto('/login')
  await page.getByRole('button', { name: '管理员进入' }).click()
  await expect(page).toHaveURL(/\/customers$/)

  // 创建
  await page.getByRole('button', { name: /新建客户/ }).click()
  // “客户名称”列可排序，AntD 会给 th 加 aria-label，而 Drawer 不会把背景表格移出可访问树；
  // 表单字段必须限定在 dialog 内，否则 getByLabel 会同时命中表头和输入框。
  const createDrawer = page.getByRole('dialog', { name: '新建客户' })
  await createDrawer.getByLabel('客户名称').fill(name)
  // AntD 6 的虚拟列表只给 0×0 的隐藏 listbox 加 role=option，可见项没有 role 也点不到；
  // 可见项带 title（rc-select 用字符串 label 生成），用 getByTitle 精确命中。
  await createDrawer.getByLabel('行业').click()
  await page.getByTitle('科技', { exact: true }).click()
  await createDrawer.getByLabel('等级').click()
  await page.getByTitle('重点', { exact: true }).click()
  await createDrawer.getByLabel('状态').click()
  await page.getByTitle('合作中', { exact: true }).click()
  await createDrawer.getByLabel('负责人').click()
  await page.getByTitle('张伟', { exact: true }).click()
  // 表单用 requiredMark="optional"，AntD 会给非必填 label 追加“（可选）”
  await createDrawer.getByLabel(/手机号/).fill('13900000000')
  await createDrawer.getByLabel(/邮箱/).fill('e2e@example.com')
  // AntD 会给两个汉字的按钮自动加空格，可访问名是“创 建”
  await createDrawer.getByRole('button', { name: /创\s*建/ }).click()
  await expect(page.getByText('已创建')).toBeVisible()

  await page.getByPlaceholder('搜索客户名称').fill(name)
  await page.getByPlaceholder('搜索客户名称').press('Enter')
  const row = page.getByRole('row', { name: new RegExp(name) }).first()
  await expect(row).toBeVisible()

  // 编辑：清空可选联系方式
  await row.getByRole('button', { name: /编\s*辑/ }).click()
  const editDrawer = page.getByRole('dialog', { name: '编辑客户' })
  await editDrawer.getByLabel(/手机号/).clear()
  await editDrawer.getByLabel(/邮箱/).clear()
  await editDrawer.getByRole('button', { name: /保\s*存/ }).click()
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
