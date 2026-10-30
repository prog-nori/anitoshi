import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 400 } });
await page.goto(new URL('../docs/icon-review.html', import.meta.url).href);
await page.screenshot({ path: '/tmp/anitoshi-icon-review.png' });
await browser.close();
