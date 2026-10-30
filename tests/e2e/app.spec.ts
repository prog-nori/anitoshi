import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const width of [320, 375, 390, 768, 1024, 1440]) {
  test(`${width}px layout, interactions, sources and accessibility`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.animal-card')).toHaveCount(10);
    await expect(page.locator('.animal-card img')).toHaveCount(10);
    expect(
      await page
        .locator('img')
        .evaluateAll((images) =>
          images.every(
            (i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    ).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `test-results/layout-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: '動物 → 人間' }).click();
    await page.getByLabel('中型犬の年齢').fill('5');
    await expect(page.getByRole('status')).toContainText('56.8');
    await page.getByText('換算方法について').click();
    await expect(page.getByRole('link', { name: /Quantitative Translation/ })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: /家庭猫/ }).click();
    await expect(page.getByRole('status')).toContainText('若い成猫期');
    await page.getByRole('button', { name: /ゴールデンハムスター/ }).click();
    await expect(page.getByRole('status')).toContainText('104');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}
test('keyboard operation and empty input', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByText('メインへ移動')).toBeFocused();
  const cat = page.getByRole('button', { name: /家庭猫/ });
  await cat.focus();
  await page.keyboard.press('Space');
  await expect(cat).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('あなたの年齢').fill('');
  await expect(page.getByRole('alert')).toContainText('空欄は0歳');
});
test('touch targets and tap operation', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173/');
  await page.getByRole('button', { name: /セキセイインコ/ }).tap();
  await expect(page.getByRole('button', { name: /セキセイインコ/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  for (const button of await page.getByRole('button').all()) {
    const box = await button.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
  await context.close();
});
test('long Japanese content and broken icons remain usable', async ({ page }) => {
  await page.route('**/missing-test-icon.svg', (route) => route.abort());
  await page.goto('/');
  await page.locator('.animal-card img').evaluateAll((images) =>
    images.forEach((i) => {
      (i as HTMLImageElement).src = '/missing-test-icon.svg';
    }),
  );
  await expect(page.locator('.animal-card .icon-fallback')).toHaveCount(10);
  await page.setViewportSize({ width: 320, height: 900 });
  await page
    .locator('.representative')
    .first()
    .evaluate((el) => {
      el.textContent =
        'とても長い日本語の代表犬種の説明が入った場合にも選択ボタンが画面からはみ出さないことを確認';
    });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('human 0–128 years including months displays qualified results at mobile width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');
  for (const value of ['0', '1', '28', '128']) {
    await page.getByLabel('あなたの年齢').fill(value);
    await expect(page.getByText('式を延長した仮の計算', { exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('科学的な年齢対応');
    await page.locator('.result-panel').screenshot({ path: `test-results/extension-${value}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel('年齢の単位').selectOption('months');
  await page.getByLabel('あなたの年齢').fill('1536');
  await expect(page.getByRole('status')).toContainText('429.4');
  await page.getByLabel('あなたの年齢').fill('1537');
  await expect(page.getByText('この年齢は、表示範囲外。')).toBeVisible();
});

test('all five reference models work both ways with sources and boundary warnings', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  for (const [name, expected] of [
    ['家庭猫', '6'],
    ['カイウサギ', '4'],
    ['ゴールデンハムスター', '1.7'],
    ['セキセイインコ', '4.3'],
    ['家畜化されたフェレット', '3.5'],
  ]) {
    await page.getByRole('button', { name: new RegExp(name!) }).click();
    await page.getByRole('button', { name: '人間 → 動物', exact: true }).click();
    await page.getByLabel('あなたの年齢').fill('40');
    await expect(page.getByRole('status')).toContainText(expected!);
    await expect(page.getByText('慣用換算表による目安', { exact: true })).toBeVisible();
    await page.locator('.model-details > summary').click();
    await expect(page.locator('.source a').first()).toBeVisible();
    await page.locator('.model-details > summary').click();
    for (const value of ['0', '128']) {
      await page.getByLabel('あなたの年齢').fill(value);
      await expect(page.getByText('表の範囲外の仮の計算', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.getByRole('button', { name: '動物 → 人間', exact: true }).click();
    await page.locator('#age').fill('2');
    await expect(page.getByText('慣用換算表による目安', { exact: true })).toBeVisible();
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
