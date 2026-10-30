import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('share preview, image download and stale-result reset at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.getByText('結果を共有する').click();
  const panel = page.locator('.share-details');
  await expect(panel.getByRole('button', { name: 'リンクをコピー' })).toBeDisabled();
  const x = new URL((await panel.getByRole('link', { name: 'Xで共有' }).getAttribute('href'))!);
  expect(x.searchParams.get('text')).toBe(await panel.locator('.share-preview').textContent());
  expect(x.href).not.toContain('127.0.0.1');
  await panel.getByRole('button', { name: 'Instagram用の画像を作る' }).click();
  const image = panel.getByRole('img');
  await expect(image).toBeVisible();
  expect(await image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(1080);
  const download = page.waitForEvent('download');
  await panel.getByRole('link', { name: '画像を保存' }).click();
  await (await download).saveAs('test-results/share-card.png');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel('あなたの年齢').fill('128');
  await page.getByText('結果を共有する').click();
  await expect(panel.locator('.share-preview')).toContainText('仮の計算');
  await expect(panel.getByRole('link', { name: '画像を保存' })).toHaveCount(0);
  await panel.getByRole('button', { name: 'Instagram用の画像を作る' }).click();
  await expect(panel.getByRole('img')).toBeVisible();
  const extended = page.waitForEvent('download');
  await panel.getByRole('link', { name: '画像を保存' }).click();
  await (await extended).saveAs('test-results/share-extension.png');
});
test('native sharing cancellation keeps the downloadable image', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: () => true });
    Object.defineProperty(navigator, 'share', {
      value: () => Promise.reject(new DOMException('cancel', 'AbortError')),
    });
  });
  await page.goto('/');
  await page.getByText('結果を共有する').click();
  await page.getByRole('button', { name: 'Instagram用の画像を作る' }).click();
  await page.getByRole('button', { name: '画像をアプリに共有' }).click();
  await expect(page.locator('.share-message')).toHaveText('共有をキャンセルしました。');
  await expect(page.getByRole('link', { name: '画像を保存' })).toBeVisible();
});
