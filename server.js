import express from 'express';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import { sendTelegram } from './utils/telegram.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.PLAYWRIGHT_TRIGGER_TOKEN;
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;

const esc = (s = '') =>
  s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// health-check
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Старий endpoint для n8n: запуск основного тесту
app.post('/run-tests', (req, res) => {
  const token = req.headers['x-api-key'];

  if (!API_KEY || token !== API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const spec = req.body?.spec;
  const baseCmd = spec
    ? `npx playwright test ${spec}`
    : 'npx playwright test tests/af_login_request_setup.spec.js';

  const cmd = `${baseCmd} --workers=1 --retries=0 --reporter=line --project=chromium`;

  console.log('[Playwright] Running:', cmd);

  exec(
    cmd,
    {
      timeout: 10 * 60 * 1000,
      maxBuffer: 10 * 1024 * 1024,
    },
    (error, stdout, stderr) => {
      const result = {
        success: !error,
        exitCode: typeof error?.code === 'number' ? error.code : 0,
        stdout,
        stderr,
      };

      if (error) {
        console.error('[Playwright ERROR]', error);
      }

      res.status(200).json(result);
    },
  );
});

// Telegram webhook: команда /fill_linkid або reply на повідомлення з bundleId
app.post('/telegram/webhook', async (req, res) => {
  const update = req.body;

  try {
    if (!update.message) {
      return res.sendStatus(200);
    }

    const msg = update.message;
    const chatId = msg.chat?.id;
    const text = (msg.text || '').trim();

    if (!chatId || !text) {
      return res.sendStatus(200);
    }

    let bundleId = '';
    let linkId = '';

    // Варіант 1: відповідь (reply) на повідомлення з bundleId
    if (msg.reply_to_message) {
      const replyText = msg.reply_to_message.text || '';

      // Шукаємо bundleId в plain text (Android: com.xxx або iOS: idXXX)
      // Android package: com., org., etc.
      const androidMatch = replyText.match(/([a-z]+\.[a-zA-Z0-9._-]+)/);
      // iOS app id: id followed by numbers
      const iosMatch = replyText.match(/(id\d+)/);

      const bundleMatch = androidMatch || iosMatch;

      if (bundleMatch && bundleMatch[1]) {
        bundleId = bundleMatch[1];
        linkId = text.trim(); // весь текст reply - це LinkID

        console.log('[Telegram] Reply-based fill_linkid', { chatId, bundleId, linkId });
      }
    }

    // Варіант 2: команда /fill_linkid bundle linkid
    if (!bundleId && text.startsWith('/fill_linkid')) {
      const parts = text.split(/\s+/);
      if (parts.length < 3) {
        if (TG_BOT_TOKEN) {
          await fetch(
            `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text:
                  '⚠️ Невірний формат.\n' +
                  'Правильно так:\n' +
                  '<code>/fill_linkid com.your.app 123-456-7890</code>',
                parse_mode: 'HTML',
              }),
            },
          ).catch(() => { });
        }

        return res.sendStatus(200);
      }

      bundleId = parts[1];
      linkId = parts.slice(2).join(' ');

      console.log('[Telegram] Command-based fill_linkid', { chatId, bundleId, linkId });
    }

    // Якщо немає ні reply, ні команди - ігноруємо
    if (!bundleId || !linkId) {
      return res.sendStatus(200);
    }

    console.log('[Telegram] /fill_linkid', { chatId, bundleId, linkId });

    // відписуємо, що прийняли
    if (TG_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text:
            `⚙️ Start filling\n` +
            `<b>Bundle:</b> <code>${esc(bundleId)}</code>\n` +
            `<b>LinkID:</b> <code>${esc(linkId)}</code>\n\n`,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      }).catch(() => { });
    }

    // запускаємо Playwright-тест fill_LinkID з env
    const spec = 'tests/fill_LinkID.spec.js';
    const cmd = `npx playwright test ${spec} --workers=1 --retries=0 --reporter=line --project=chromium`;

    console.log('[Playwright] Running fill_LinkID:', cmd);

    exec(
      cmd,
      {
        timeout: 10 * 60 * 1000,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          AF_APP_BUNDLE: bundleId,
          AF_LINK_ID: linkId,
        },
      },
      async (error, stdout, stderr) => {
        let statusText;
        if (error) {
          console.error('[Playwright fill_LinkID ERROR]', error);
          statusText =
            '❌ <b>fill_LinkID failed</b>\n' +
            `<b>Bundle:</b> <code>${esc(bundleId)}</code>\n` +
            `<b>LinkID:</b> <code>${esc(linkId)}</code>\n` +
            `<b>Code:</b> ${error.code ?? '—'}`;
        } else {
          statusText =
            '✅ <b>fill_LinkID done</b>\n' +
            `<b>Bundle:</b> <code>${esc(bundleId)}</code>\n` +
            `<b>LinkID:</b> <code>${esc(linkId)}</code>`;
        }

        // у той самий чат (баєрська група)
        if (TG_BOT_TOKEN) {
          try {
            await fetch(
              `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
              {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: statusText,
                  parse_mode: 'HTML',
                  disable_web_page_preview: true,
                }),
              },
            );
          } catch (e) {
            console.error(
              'Failed to send fill_LinkID status to Telegram:',
              e,
            );
          }
        }

        // Надсилаємо також у логову групу
        const TG_CHAT_LOGS_ID = process.env.TG_CHAT_LOGS_ID;
        if (TG_BOT_TOKEN && TG_CHAT_LOGS_ID && TG_CHAT_LOGS_ID !== chatId) {
          try {
            await fetch(
              `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
              {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  chat_id: TG_CHAT_LOGS_ID,
                  text: statusText,
                  parse_mode: 'HTML',
                  disable_web_page_preview: true,
                }),
              },
            );
          } catch (e) {
            console.error(
              'Failed to send fill_LinkID status to logs group:',
              e,
            );
          }
        }
      },
    );

    return res.sendStatus(200);
  } catch (e) {
    console.error('Error in /telegram/webhook handler', e);
    return res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
