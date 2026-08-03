import { expect, test } from '@playwright/test'

test('home loads the archive and main navigation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /把她的声音/ })).toBeVisible()
  await expect(page.getByRole('navigation', { name: '主导航' })).toContainText('探索')
  await expect(page.getByRole('link', { name: /进入展厅/ })).toHaveAttribute('href', '/explore')
})

test('explore searches and filters works', async ({ page }) => {
  await page.goto('/explore')
  const search = page.getByRole('textbox', { name: '搜索作品' })
  await search.fill('Sora')
  await expect(page.getByText('1 件作品')).toBeVisible()
  await expect(
    page.getByRole('link', { name: '天依蓝 / Blue Hour Studies', exact: true }),
  ).toBeVisible()
})

test('work and creator detail routes render', async ({ page }) => {
  await page.goto('/works/blue-hour')
  await expect(page.getByRole('heading', { name: /Blue Hour Studies/ })).toBeVisible()
  await expect(page.getByRole('region', { name: '版权与署名信息' })).toContainText(
    '许可证 / LICENSE',
  )
  await expect(page.getByRole('region', { name: '版权与署名信息' })).toContainText(
    'AI 使用声明 / AI DISCLOSURE',
  )
  await page.getByRole('link', { name: /Sora Kim/ }).click()
  await expect(page).toHaveURL(/\/creator\/sora-kim$/)
  await expect(page.getByRole('heading', { name: 'Sora Kim' })).toBeVisible()
})

test('all visible artwork images load with valid dimensions', async ({ page }) => {
  await page.goto('/explore')
  const images = page.locator('img')
  await expect(images).not.toHaveCount(0)
  const dimensions = await images.evaluateAll((items) =>
    items.map((image) => ({ width: image.naturalWidth, height: image.naturalHeight })),
  )
  expect(dimensions.every(({ width, height }) => width > 0 && height > 0)).toBe(true)
})

test('upload form is available and ready for submission', async ({ page }) => {
  await page.goto('/upload')
  await expect(page.getByRole('heading', { name: /被听见/ })).toBeVisible()
  await expect(page.getByRole('textbox', { name: '作品标题' })).toBeVisible()
  await expect(page.getByLabel('作品图片')).toBeVisible()
  await expect(page.getByRole('button', { name: /提交作品|正在提交/ })).toBeVisible()
})
