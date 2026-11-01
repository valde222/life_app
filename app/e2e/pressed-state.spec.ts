import { expect, test } from '@playwright/test';
import { freshAccount, signIn } from './support';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

test('a pressed button stops looking pressed once the mouse moves off it', async ({ page }) => {
  await freshAccount();
  await signIn(page);
  const button = page.getByRole('button', { name: '+ New group' });
  const box = (await button.boundingBox())!;

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(button).not.toHaveCSS('transform', 'none');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height + 200);
  await expect(button).toHaveCSS('transform', 'none');
  await page.mouse.up();
});
