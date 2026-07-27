import { expect, test } from '@playwright/test'

test('judge can browse a real channel and reset the isolated session', async ({ page }) => {
  await page.goto('/#/trial')

  await expect(page.getByRole('heading', { name: /第一次点.*也有依据/ })).toBeVisible()
  await expect(page.getByTestId('store-card')).toHaveCount(12)
  await page.getByRole('button', { name: '25元以内', exact: true }).click()
  await expect(page.getByTestId('store-card')).toHaveCount(9)
  await page.getByRole('link', { name: /查看巷口牛肉饭/ }).click()
  await expect(page.getByRole('heading', { name: '巷口牛肉饭' })).toBeVisible()
  await page.getByLabel('展开体验工具').click()
  await page.getByRole('button', { name: '重置体验数据' }).click()
  await expect(page.getByText('当前体验空间已重置')).toBeVisible()
})
