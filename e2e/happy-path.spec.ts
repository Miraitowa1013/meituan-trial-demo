import { expect, test } from '@playwright/test'

test.afterEach(async ({ page, request }) => {
  const sessionId = await page.evaluate(() => localStorage.getItem('meituan-trial:session'))
  if (sessionId) await request.post(`/api/sessions/${encodeURIComponent(sessionId)}/reset`)
})

test('native entry reaches all three independent store decisions', async ({ page }) => {
  await page.goto('/#/meituan')
  await page.getByRole('link', { name: /试新/ }).first().click()
  await page.getByRole('searchbox', { name: '说说这次想吃什么' }).fill('25元以内牛肉饭，少油，汤别洒')
  await page.getByRole('button', { name: '帮我找合适的' }).click()
  await page.getByRole('button', { name: /查看.*选择/ }).click()

  const evidenceLinks = page.getByRole('link', { name: /查看.*可信证据/ })
  await expect(evidenceLinks).toHaveCount(3)

  await evidenceLinks.nth(1).click()
  await expect(page.getByRole('heading', { name: '老灶牛肉盖饭' })).toBeVisible()
  await expect(page.getByText('34 笔完成订单')).toBeVisible()
  await expect(page.getByText(/11 笔认为偏油/).first()).toBeVisible()
})

test('native entry to shared merchant evidence ledger', async ({ page }) => {
  await page.goto('/#/meituan')
  await page.getByRole('link', { name: /试新/ }).first().click()
  await page.getByRole('searchbox', { name: '说说这次想吃什么' }).fill('25元以内牛肉饭，少油，汤别洒')
  await page.getByRole('button', { name: '帮我找合适的' }).click()
  await page.getByRole('button', { name: /查看.*选择/ }).click()
  await page.getByRole('link', { name: /查看.*可信证据/ }).first().click()
  await page.getByRole('button', { name: /选择套餐与承诺/ }).click()
  await page.getByRole('button', { name: '继续核对配送信息' }).click()
  await page.getByRole('button', { name: '提交订单' }).click()
  await expect(page.getByRole('heading', { name: '试新订单详情' })).toBeVisible()

  await page.getByRole('button', { name: '模拟送达并进入餐后验证' }).click()
  await page.getByRole('button', { name: '一键确认客观承诺已兑现' }).click()
  await page.getByLabel('偏清淡').check()
  await page.getByLabel('愿意正常价复购').check()
  await page.getByRole('button', { name: '提交有效验证' }).click()
  await expect(page.getByText('9/9')).toBeVisible()

  await page.getByRole('link', { name: /查看商家经营台/ }).click()
  await expect(page.getByRole('heading', { name: '试新经营台' })).toBeVisible()
  await expect(page.getByText('9/9', { exact: true })).toBeVisible()
  await expect(page.getByText('8/9', { exact: true })).toBeVisible()
  await expect(page.getByText('7/9', { exact: true })).toBeVisible()
  await expect(page.getByText('9/10', { exact: true })).toBeVisible()
})
