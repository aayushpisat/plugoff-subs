import { test, expect } from '@playwright/test';

for (const width of [320, 360, 390, 768, 1024, 1440]) {
  for (const route of ['/', '/about', '/blog', '/contact', '/products', '/account', '/cart']) {
    test(`${route} fits ${width}px without overflow or illustrated copy overlap`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`/#${route}`);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (width < 1024) {
        for (const section of await page.locator('.illustrated-section').all()) {
          const art = await section.locator('.illustrated-section__art').boundingBox();
          const copy = await section.locator('.illustrated-section__content').boundingBox();
          expect(art.y).toBeGreaterThanOrEqual(copy.y + copy.height - 1);
          expect(art.height).toBeGreaterThan(200);
          const image = section.locator('img');
          await expect(image).toBeVisible();
          expect(await image.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
        }
        if (route === '/') {
          const art = await page.locator('.unplug-art').boundingBox();
          const columns = page.locator('.unplug-grid > :not(.unplug-art)');
          const first = await columns.nth(0).boundingBox();
          const last = await columns.nth(1).boundingBox();
          expect(art.y).toBeGreaterThanOrEqual(first.y + first.height);
          expect(last.y).toBeGreaterThanOrEqual(art.y + art.height);
          const toggle = page.getByRole('button', { name: /Interactive Screens/ });
          await toggle.focus(); await page.keyboard.press('Enter');
          await expect(toggle).toHaveAttribute('aria-pressed', 'true');
        }
      }
      expect(errors).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`page-${width}.png`), fullPage: true });
    });
  }
}

test('phone menu closes with Escape and supports navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Toggle navigation menu' });
  await menu.click(); await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape'); await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click(); await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/#\/about$/);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});
