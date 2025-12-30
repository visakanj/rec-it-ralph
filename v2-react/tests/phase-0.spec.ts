import { test, expect } from '@playwright/test';

test.describe('Phase 0 QA - React Infrastructure', () => {

  test.beforeEach(async ({ page }) => {
    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`Console error: ${msg.text()}`);
      }
    });
  });

  test('should load /v2-react/ with minimal UI shell', async ({ page }) => {
    await page.goto('http://localhost:5173/v2-react/');

    // Check page loads
    await expect(page).toHaveTitle('Rec-It-Ralph - V2 React');

    // Check bottom nav is visible
    const bottomNav = page.locator('nav');
    await expect(bottomNav).toBeVisible();

    // Check all 4 tabs are present (use role='link' to target nav tabs specifically)
    await expect(page.getByRole('link', { name: /Rooms/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Pool/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Tonight/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Watched/ })).toBeVisible();
  });

  test('should switch between placeholder screens', async ({ page }) => {
    await page.goto('http://localhost:5173/v2-react/');

    // Default route should show Rooms screen
    await expect(page.getByText('Coming soon in Phase 1')).toBeVisible();

    // Navigate to Pool
    await page.getByText('Pool').click();
    await expect(page).toHaveURL(/.*\/pool/);
    await expect(page.getByText('Coming soon in Phase 3')).toBeVisible();

    // Navigate to Tonight
    await page.getByText('Tonight').click();
    await expect(page).toHaveURL(/.*\/tonight/);
    await expect(page.getByText('Coming soon in Phase 5')).toBeVisible();

    // Navigate to Watched
    await page.getByText('Watched').click();
    await expect(page).toHaveURL(/.*\/watched/);
    await expect(page.getByText('Coming soon in Phase 6')).toBeVisible();
  });

  test('should highlight active tab correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/v2-react/');

    // Rooms tab should be active (has text-accent class)
    const roomsTab = page.getByRole('link', { name: /Rooms/ });
    await expect(roomsTab).toHaveClass(/text-accent/);

    // Navigate to Pool and check it becomes active
    await page.getByRole('link', { name: /Pool/ }).click();
    const poolTab = page.getByRole('link', { name: /Pool/ });
    await expect(poolTab).toHaveClass(/text-accent/);
  });

  test('should have Firebase and adapter ready', async ({ page }) => {
    // NOTE: This test will fail in dev mode because /app.js and /v2/data-adapter.js
    // are not served by Vite dev server (they're outside v2-react directory).
    // This test is designed for production/preview environments.
    test.skip(process.env.CI !== 'true', 'Skipping in dev mode - requires production build');

    await page.goto('http://localhost:5173/v2-react/');

    // Wait for scripts to load
    await page.waitForTimeout(2000);

    // Check window.firebase exists
    const hasFirebase = await page.evaluate(() => !!window.firebase);
    expect(hasFirebase).toBe(true);

    // Check window.database exists
    const hasDatabase = await page.evaluate(() => !!window.database);
    expect(hasDatabase).toBe(true);

    // Check window.v2Adapter exists
    const hasAdapter = await page.evaluate(() => !!window.v2Adapter);
    expect(hasAdapter).toBe(true);

    // Check window.RECITRALPH_V2_MODE is true
    const v2Mode = await page.evaluate(() => window.RECITRALPH_V2_MODE);
    expect(v2Mode).toBe(true);
  });

  test('should not have console errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:5173/v2-react/');
    await page.waitForTimeout(2000); // Wait for all scripts to load

    // Filter out known/expected errors (if any)
    const unexpectedErrors = consoleErrors.filter(err =>
      !err.includes('404') // Ignore 404s for now
    );

    expect(unexpectedErrors).toHaveLength(0);
  });

  test('should render all routes without errors', async ({ page }) => {
    const routes = ['/', '/pool', '/tonight', '/watched'];

    for (const route of routes) {
      await page.goto(`http://localhost:5173/v2-react${route}`);

      // Check page doesn't show error
      const hasError = await page.locator('text=/error|crash|fail/i').count();
      expect(hasError).toBe(0);

      // Check bottom nav is still visible
      await expect(page.locator('nav')).toBeVisible();
    }
  });
});
