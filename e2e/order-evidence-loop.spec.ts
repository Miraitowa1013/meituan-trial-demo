import { expect, test } from '@playwright/test'

test('a trial order locks its objective promise and grows the same ledger', async ({ page }) => {
  await page.goto('/#/trial/stores/store-beef-01')
  await page.getByRole('button', { name: /选择套餐与承诺/ }).click()
  await page.getByRole('button', { name: '继续核对配送信息' }).click()
  await expect(page.getByText('汤与米饭使用独立密封容器', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '提交订单' }).click()

  await page.getByRole('button', { name: '模拟送达并进入餐后验证' }).click()
  await expect(page.getByRole('heading', { name: '20 秒，留下有效验证' })).toBeVisible()
  await page.getByRole('button', { name: '一键确认客观承诺已兑现' }).click()
  await page.getByLabel('正合适').check()
  await page.getByLabel('愿意正常价复购').check()
  await page.getByRole('button', { name: '提交有效验证' }).click()

  await expect(page.getByText('8/10 → 9/10')).toBeVisible()
  await expect(page.getByText('9/9', { exact: true })).toBeVisible()
})
