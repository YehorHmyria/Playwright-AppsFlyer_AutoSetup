import 'dotenv/config';

const BOT = process.env.TG_BOT_TOKEN;
const CHAT_LOGS = process.env.TG_CHAT_LOGS_ID;
const CHAT_BUYERS = process.env.TG_CHAT_BUYERS_ID;

const esc = (s = '') =>
  s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/**
 * Базова функція відправки повідомлень у Telegram.
 * За замовчуванням шле в логову групу, але можна передати інший chatId.
 */
export async function sendTelegram(html, { chatId = CHAT_LOGS } = {}) {
  if (!BOT || !chatId) return;

  const payload = {
    chat_id: chatId,
    text: html,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };

  const res = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `Telegram send failed: ${res.status} ${await res.text().catch(() => '')}`,
    );
  }
}

/** Лог у логову групу */
export async function SendLog(message) {
  await sendTelegram(message);
}

/** Надіслати помилку і зупинити тест */
export async function notifyAndFail({ page, title = '', err, bundleId = '' }) {
  const e =
    err instanceof Error
      ? err
      : new Error(err ? String(err) : 'Manual fail (no error object)');

  const where =
    (e.stack?.split('\n')[1] || '').trim() ||
    (new Error().stack?.split('\n')[2] || '').trim() ||
    'unknown';

  const url = typeof page?.url === 'function' ? page.url() : '';

  await sendTelegram(
    '❌ <b>Failed</b>\n' +
    `<b>Test:</b> ${esc(title)}\n` +
    `<b>Bundle:</b> <code>${esc(bundleId || '')}</code>\n` +
    `<b>Error:</b> ${esc(e.message)}\n` +
    `<b>At:</b> <code>${esc(where)}</code>\n` +
    `<b>URL:</b> ${esc(url)}`,
  );

  throw e;
}

/**
 * Повідомлення в баєрську групу після успішного сетапу:
 * інфа по апці + інструкція, як викликати fill_LinkID.
 */
export async function notifyBuyersSetupDone({ bundleId, appName }) {
  if (!CHAT_BUYERS || !BOT) return;

  const title = appName || bundleId || 'App';

  const text =
    '✅ <b>App ready for LinkID</b>\n' +
    `<b>Bundle:</b> <code>${esc(bundleId || '—')}</code>\n\n` +
    `📝 <b>Відповідайте на це повідомлення</b> і напишіть тільки ваш LinkID:\n` +
    `<i>Приклад: 123-456-7890</i>`;

  const payload = {
    chat_id: CHAT_BUYERS,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: {
      force_reply: true,
      input_field_placeholder: 'Введіть ваш LinkID...',
      selective: false
    }
  };

  const res = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `Telegram send failed: ${res.status} ${await res.text().catch(() => '')}`,
    );
  }

  // Return message_id для можливості потім пов'язати reply
  const result = await res.json();
  return result.result?.message_id;
}
