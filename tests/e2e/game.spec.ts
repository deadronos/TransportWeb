import { test, expect } from '@playwright/test';

test.describe('Game Canvas', () => {
  test('should render 3D canvas', async ({ page }) => {
    await page.goto('/');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show HUD controls', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /×1/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /×2/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /×4/i })).toBeVisible();
  });

  test('should toggle pause state', async ({ page }) => {
    await page.goto('/');

    const pauseButton = page.getByRole('button', { name: /pause/i });
    await pauseButton.click();

    await expect(pauseButton).toContainText('Play');
    await pauseButton.click();
    await expect(pauseButton).toContainText('Pause');
  });
});
