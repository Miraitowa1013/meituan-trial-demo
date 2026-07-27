import { expect, test } from '@playwright/test'

test.afterEach(async ({ page, request }) => {
  const sessionId = await page.evaluate(() => localStorage.getItem('meituan-trial:session'))
  if (sessionId) await request.post(`/api/sessions/${encodeURIComponent(sessionId)}/reset`)
})

test('merchant publishes V2 and the same version flows through order verification', async ({ page }) => {
  await page.goto('/#/merchant/store-beef-01/plans')
  await expect(page.getByText('试新方案 V1')).toBeVisible()
  await page.getByRole('button', { name: '编辑为新版本' }).click()
  await page.getByLabel('商品卖点原文').fill('汤饭分开装，可按备注少油，牛肉标称80g，招牌好吃不踩雷')
  await page.getByRole('button', { name: 'AI 识别可验证卖点' }).click()
  await expect(page.getByLabel('编辑 汤与米饭使用独立密封容器')).toBeVisible()
  await page.getByRole('button', { name: '拒绝 招牌好吃不踩雷' }).click()
  await page.getByRole('button', { name: '发布试新方案' }).click()
  await expect(page.getByRole('status')).toContainText('V2 已发布')

  await page.getByRole('link', { name: /查看用户端/ }).click()
  await expect(page.getByText('本期试新计划 · V2')).toBeVisible()
  await page.getByRole('button', { name: /选择套餐与承诺/ }).click()
  await page.getByRole('button', { name: '继续核对配送信息' }).click()
  await expect(page.getByText('商家已确认 · 版本 2 · 随单存证')).toBeVisible()
  await page.getByRole('button', { name: '提交订单' }).click()

  await page.getByRole('button', { name: '模拟送达并进入餐后验证' }).click()
  await expect(page.getByRole('heading', { name: '20 秒，留下有效验证' })).toBeVisible()
  await page.getByRole('button', { name: '一键确认客观承诺已兑现' }).click()
  await page.getByLabel('偏清淡').check()
  await page.getByLabel('愿意正常价复购').check()
  await page.getByRole('button', { name: '提交有效验证' }).click()

  await expect(page.getByText('8/10 → 9/10')).toBeVisible()
  await page.getByRole('link', { name: '查看商家经营台同步结果' }).click()
  await expect(page.getByText('9/9', { exact: true })).toBeVisible()
  await expect(page.getByText('8/9', { exact: true })).toBeVisible()
  await expect(page.getByText('7/9', { exact: true })).toBeVisible()
})
