import { test, expect } from '@playwright/test';
import { SendLog, notifyAndFail } from '../utils/telegram.js';
import 'dotenv/config';

test('Fill LinkID for existing app', async ({ page }) => {
  test.setTimeout(180000);

  const title = test.info().title;

  try {
    const LOGIN_URL = 'https://hq1.appsflyer.com/auth/login';
    const USER_EMAIL = process.env.AF_EMAIL;
    const USER_PASSWORD = process.env.AF_PASSWORD;
    const LINK_ID = process.env.AF_LINK_ID;
    const BUNDLE = process.env.AF_APP_BUNDLE;
    const INTEGRATION_NAME =
      process.env.AF_INTEGRATION_NAME || 'Google Ads (Adwords) Ad';

    if (!BUNDLE || !LINK_ID) {
      await SendLog(
        '❌ <b>fill_LinkID:</b> AF_APP_BUNDLE або AF_LINK_ID не задані',
      );
      throw new Error('AF_APP_BUNDLE/AF_LINK_ID are required');
    }

    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(LOGIN_URL);
    await page.getByRole('textbox', { name: 'user-email' }).fill(USER_EMAIL);
    await page.getByRole('textbox', { name: 'Password' }).fill(USER_PASSWORD);
    await page.getByRole('button', { name: 'login' }).click();

    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(
      () => { },
    );

    await SendLog(
      `<b>⚙️ fill_LinkID start</b>\n<b>Bundle:</b> <code>${BUNDLE}</code>\n<b>LinkID:</b> <code>${LINK_ID}</code>`,
    );

    // My Apps
    await page.click('[data-qa-id="header-item-icon-myApps"]', { force: true });

    // search app - click List view only if enabled
    const listViewBtn = page.getByRole('button', { name: 'List view' });
    if (await listViewBtn.isEnabled()) {
      await listViewBtn.click();
    }
    await page
      .getByRole('searchbox', { name: 'Search for app name, app ID,' })
      .click();
    await page
      .getByRole('searchbox', { name: 'Search for app name, app ID,' })
      .fill(BUNDLE);

    const appCard = page.locator(
      `[data-qa-id="tooltip"][aria-label="${BUNDLE}"]`,
    );
    await appCard.waitFor({ state: 'visible', timeout: 10000 });
    await appCard.scrollIntoViewIfNeeded();
    await appCard.click();

    // side nav
    const sideNav = page.locator('[data-qa-id="side-nav-container"]');
    await sideNav.waitFor({ state: 'visible' });
    await sideNav.hover({ force: true });

    // Collaborate → Active Integrations → потрібний партнер
    const collab = page.locator(
      '[data-qa-id="side-menu-section-collaborate-section--name"]',
    );
    await collab.waitFor({ state: 'visible', timeout: 10000 });
    await collab.scrollIntoViewIfNeeded();
    await collab.click();

    await page.getByRole('link', { name: 'Active Integrations' }).click();
    await page.getByRole('link', { name: 'Google Ads (Adwords) Ad' }).click();

    // оновити LinkID - спочатку очищаємо поле, потім вставляємо
    const linkInput = page.getByRole('textbox').first();
    await linkInput.waitFor({ state: 'visible', timeout: 10000 });
    await linkInput.clear();
    await linkInput.fill(LINK_ID);

    await page.getByRole('button', { name: 'Save Integration' }).click();

    // Success notification handled by server.js (sends to both groups)
  } catch (err) {
    await notifyAndFail({
      page,
      title,
      err,
      bundleId: process.env.AF_APP_BUNDLE,
    });
    throw new Error('Stopped after TG (fill_LinkID)');
  }
});
