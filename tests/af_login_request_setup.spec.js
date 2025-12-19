import { test, expect } from '@playwright/test';
import {
  SendLog,
  sendTelegram,
  notifyAndFail,
  notifyBuyersSetupDone,
} from '../utils/telegram.js';


import { CheckLogIn } from '../utils/functions.js';


test('Appsflyer Google Ads Setup', async ({ page }) => {

  test.setTimeout(180000);

  let bundleId = '';  //це потрібно для тестування, коли апок на прийняття немає. 
  //коли буде запуск, то цю змінну потрібно лишити пустою
  const title = test.info().title;


  try {
    const LOGIN_URL = 'https://hq1.appsflyer.com/auth/login';
    const USER_EMAIL = process.env.AF_EMAIL;
    const USER_PASSWORD = process.env.AF_PASSWORD;
    const LINK_ID = process.env.AF_LINK_ID;
    const TG_TOKEN = process.env.TG_BOT_TOKEN;
    const TG_CHAT = process.env.TG_CHAT_LOGS_ID;


    await page.setViewportSize({ width: 1440, height: 900 });


    await page.goto(LOGIN_URL);
    await page.getByRole('textbox', { name: 'user-email' }).fill(USER_EMAIL);
    await page.getByRole('textbox', { name: 'Password' }).fill(USER_PASSWORD);
    await page.getByRole('button', { name: 'login' }).click();

    await CheckLogIn(page);
    await page.waitForTimeout(4000);

    // myapps
    await page.click('[data-qa-id="header-item-icon-myApps"]', { force: true });
    await SendLog(`<b>⚙️ My Apps - clicked</b>`);


    // start review
    await page.getByRole('button', { name: 'Review request' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Next/i })).toBeVisible();

    // зчитуємо bundleId
    const bundleEl = dialog
      .locator('[data-qa-id="typography"]')
      .filter({ hasText: /^com\./ })
      .first();

    await expect(bundleEl, 'Bundle text not found in dialog').toBeVisible();
    bundleId = (await bundleEl.textContent() || '').trim();
    test.info().annotations.push({ type: 'bundleId', description: bundleId });

    await SendLog(`<b>⚠️ Start Setup</b>\n<b>Bundle:</b> ${bundleId || '—'}`);

    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('checkbox', { name: 'I, the app recipient, have' }).check();
    await page.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    // search new app
    const listViewBtn = page.getByRole('button', { name: 'List view' });
    if (await listViewBtn.isEnabled()) {
      await listViewBtn.click();
    }
    await page.getByRole('searchbox', { name: 'Search for app name, app ID,' }).click();
    await page.getByRole('searchbox', { name: 'Search for app name, app ID,' }).fill(bundleId);
    const appCard = page.locator(`[data-qa-id="tooltip"][aria-label="${bundleId}"]`);
    await appCard.waitFor({ state: 'visible', timeout: 10000 });
    await appCard.scrollIntoViewIfNeeded();
    await appCard.click();


    const sideNav = page.locator('[data-qa-id="side-nav-container"]');
    await sideNav.waitFor({ state: 'visible' });
    await sideNav.hover({ force: true });


    // go to integration
    const collab = page.locator('[data-qa-id="side-menu-section-collaborate-section--name"]');
    await collab.waitFor({ state: 'visible', timeout: 10000 });
    await collab.scrollIntoViewIfNeeded();
    await collab.click();
    await page.getByRole('link', { name: 'Active Integrations' }).click();
    await page.getByRole('link', { name: 'Google Ads (Adwords) Ad' }).click();

    await SendLog(`<b>⚙️ GAds setup - start</b>`);

    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
    await page.waitForTimeout(2000);
    await page.click('[data-qa-id="enable-integration-toggle"]', { force: true });

    await page.getByRole('checkbox', { name: 'Deferred deep linking with' }).check();
    await page.waitForTimeout(1000);
    await page.click('[data-qa-id="CB_advanced_data_sharing"]', { force: true });

    // mapping signup/confirmed (ваш блок без змін)
    const toggle = page.locator('.msc-tab__section .msc-section .msc-heading__title-wrapper .mp-MuiSwitch-root .mp-MuiButtonBase-root');
    await toggle.waitFor({ state: 'visible', timeout: 15000 });
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();



    await page.getByRole('button', { name: 'This partner only' }).click();
    await page.getByRole('button', { name: 'All media sources, including' }).nth(3).click();

    await page.getByRole('button', { name: 'Add event' }).click();
    await page.getByRole('button', { name: 'Select' }).first().click();
    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    await page.getByRole('textbox', { name: 'Text' }).fill('signup');
    await page.getByRole('button', { name: 'create new label', exact: true }).click();
    await page.getByRole('button', { name: 'signup' }).nth(3).click();
    await page.getByRole('button', { name: 'Select' }).click();
    await page.getByRole('button', { name: 'custom->sign_up' }).nth(3).click();
    await page.getByRole('button', { name: 'This partner only' }).click();
    await page.getByRole('button', { name: 'All media sources, including' }).nth(3).click();
    await page.getByRole('button', { name: 'No values & no revenue' }).click();
    await page.getByRole('button', { name: 'Values & no revenue' }).nth(5).click();

    await page.getByRole('button', { name: 'Add event' }).click();
    await page.getByRole('button', { name: 'Select' }).first().click();
    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    await page.getByRole('textbox', { name: 'Text' }).fill('confirmed');
    await page.getByRole('button', { name: 'create new label', exact: true }).click();
    await page.getByRole('button', { name: 'confirmed' }).nth(3).click();
    await page.getByRole('button', { name: 'Select' }).click();
    await page.getByRole('button', { name: 'in_app_purchase' }).nth(3).click();
    await page.getByRole('button', { name: 'This partner only' }).click();
    await page.getByRole('button', { name: 'All media sources, including' }).nth(3).click();
    await page.getByRole('button', { name: 'No values & no revenue' }).click();
    await page.getByRole('button', { name: 'Values & revenue' }).nth(3).click();

    await page.getByRole('button', { name: 'Save Integration' }).click();

    await SendLog(`<b>✔️ GAds setup - done</b>`);

    await page.waitForTimeout(5000);
    await page.reload();
    await page.waitForTimeout(1000);


    // permissions
    await page.getByRole('tab', { name: 'Permissions' }).click();

    await SendLog(`<b>⚙️Permissions - start</b>`);

    await page.getByRole('checkbox', { name: 'Ad network permissions' }).click();
    await page.getByRole('checkbox', { name: 'Configure integration' }).click();
    await page.getByRole('checkbox', { name: 'Configure in-app event' }).click();
    await page.getByRole('checkbox', { name: 'Access retention report' }).click();
    await page.getByRole('checkbox', { name: 'Access aggregate loyal users' }).click();
    await page.getByRole('checkbox', { name: 'Access aggregate conversions' }).click();
    await page.getByRole('checkbox', { name: 'Access aggregate in-app' }).click();
    await page.getByRole('checkbox', { name: 'View validation rules' }).click();
    await page.getByRole('checkbox', { name: 'Access aggregate revenue data' }).click();
    await page.getByRole('checkbox', { name: 'Use Cost Import' }).click();
    await page.getByRole('checkbox', { name: 'Access Protect360 dashboard' }).click();
    await page.getByRole('button', { name: 'Save Permissions' }).click();

    await SendLog(`<b>✔️ Permissions - done</b>`);

    await page.waitForTimeout(4000);

    // reselect app by bundle
    await sideNav.waitFor({ state: 'visible' });
    await sideNav.hover({ force: true });


    // Push API
    await page.locator('div').filter({ hasText: /^Export$/ }).nth(1).click();
    await page.getByRole('link', { name: 'API Access' }).click();

    // reselect app by bundle
    const chip = page.locator('[data-qa-id="single-select-chip-app-selector"]').first();
    await chip.waitFor({ state: 'visible' });
    await chip.click();
    await page.getByRole('textbox', { name: 'Search...' }).fill(bundleId);
    const opt = page.locator('[data-qa-id="select-option-value"]').first();
    await opt.waitFor({ state: 'visible' });
    await opt.click();
    await page.waitForTimeout(1000);

    await SendLog(`<b>⚙️ Push API setup - start</b>`);

    // endpoint #1
    await page.getByRole('button', { name: 'Add endpoint' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'Endpoint URL' }).click();
    await page.getByRole('textbox', { name: 'Endpoint URL' }).fill('https://api130.app-octopus.com/postback/apf-event');
    await page.waitForTimeout(1000);
    await page.click('[data-qa-id="checkbox-install-organic"]', { force: true });
    await page.waitForTimeout(1000);

    await page.click('[data-qa-id="checkbox-reengagement-regular"]', { force: true });
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, 150);
    await page.waitForTimeout(1000);

    await page.click('[data-qa-id="checkbox-reattribution-regular"]', { force: true });
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(1000);

    await page.click('[data-qa-id="checkbox-inapp-install-organic"]', { force: true });
    await page.waitForTimeout(1000);

    await page.click('[data-qa-id="checkbox-inapp-install-regular"]', { force: true });
    await page.waitForTimeout(1000);

    await page.click('[data-qa-id="checkbox-inapp-reengagement-regular"]', { force: true });
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, 50);

    await page.click('[data-qa-id="checkbox-inapp-reattribution-regular"]', { force: true });
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: 'App ID +' }).click();
    await page.getByRole('button', { name: 'Select All Select All' }).nth(3).click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);

    //endpoint #2 - різні URL для iOS vs Android
    await page.getByRole('button', { name: 'Add endpoint' }).click();
    await page.waitForTimeout(2000);

    // Визначаємо URL в залежності від типу додатку
    const isIOS = bundleId.startsWith('id');
    const endpoint2Url = isIOS
      ? 'https://ios-api.app-octopus.com/postback/apf-event'
      : 'https://api.app-octopus.com/postback/apf-event';

    await page.getByRole('textbox', { name: 'Endpoint URL' }).nth(1).click();
    await page.getByRole('textbox', { name: 'Endpoint URL' }).nth(1).fill(endpoint2Url);
    await page.waitForTimeout(1000);

    const block_api = page.locator(
      `[data-qa-id="pushapi-endpoint-post-${endpoint2Url}"]`
    );

    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(1000);
    await block_api.locator('[data-qa-id="checkbox-install-organic"]').click({ force: true });
    await page.waitForTimeout(1000);

    await block_api.locator('[data-qa-id="checkbox-reengagement-regular"]').click({ force: true });
    await page.mouse.wheel(0, 150);
    await page.waitForTimeout(1000);

    await block_api.locator('[data-qa-id="checkbox-reattribution-regular"]').click({ force: true });
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(1000);

    await block_api.locator('[data-qa-id="checkbox-inapp-install-organic"]').click({ force: true });
    await page.waitForTimeout(1000);

    await block_api.locator('[data-qa-id="checkbox-inapp-install-regular"]').click({ force: true });
    await page.waitForTimeout(1000);

    await block_api.locator('[data-qa-id="checkbox-inapp-reengagement-regular"]').click({ force: true });
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, 50);

    await block_api.locator('[data-qa-id="checkbox-inapp-reattribution-regular"]').click({ force: true });
    await page.waitForTimeout(1000);
    await page.waitForTimeout(1000);

    await block_api.getByRole('button', { name: 'App ID +' }).click();
    await page.getByRole('checkbox', { name: 'Select All' }).check();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Save' }).click();


    await SendLog(`<b>✔️ Push API setup - done</b>`);

    await page.waitForTimeout(1000);

    await sendTelegram(`✅ <b>Done</b>\n<b>Test:</b> ${title}\n<b>Bundle:</b> ${bundleId || '—'}`);

    const appName = process.env.AF_APP_NAME || bundleId || '';
    await notifyBuyersSetupDone({ bundleId, appName });

  } catch (err) {
    await notifyAndFail({ page, title: test.info().title, err, bundleId });
    throw new Error('Stopped after TG');
  } finally {
    return;
  }
});
