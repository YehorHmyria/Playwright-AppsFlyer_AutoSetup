// reporters/telegram-notifier.js  (ESM)
const esc = (s = '') => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

export default class TelegramReporter {
  constructor(opts = {}) {
    this.opts = { watchdogMs: 120000, ...opts };       // 2 хв за замовчуванням
    this.timers = new Map();
  }

  async onTestBegin(test) {
    const title = test.titlePath().join(' › ');
    // watchdog: якщо тест триває > watchdogMs — шлемо алерт
    const timer = setTimeout(() => {
      this._send(`⏱ <b>Stuck</b>\n<b>Test:</b> ${esc(title)}`);
    }, this.opts.watchdogMs);
    this.timers.set(test.id, timer);
  }

  async onTestEnd(test, result) {
    // прибираємо watchdog
    const t = this.timers.get(test.id);
    if (t) clearTimeout(t), this.timers.delete(test.id);

    if (result.status === 'failed' || result.status === 'timedOut') {
      const title = test.titlePath().join(' › ');
      const ann = test.annotations?.find(a => a.type === 'bundleId')?.description;
      const err = result.error || {};
      const msg = err.message || String(err);
      const where = (err.stack || msg || '').split('\n')[0];

      await this._send(
        `❌ <b>Failed</b>\n` +
        `<b>Test:</b> ${esc(title)}\n` +
        (ann ? `<b>Bundle:</b> <code>${esc(ann)}</code>\n` : '') +
        `<b>Status:</b> ${result.status}\n` +
        `<b>Error:</b> ${esc(msg)}\n` +
        (where ? `<b>At:</b> <code>${esc(where)}</code>` : '')
      );
    }
  }

  async onError(error) {
    await this._send(`❌ <b>Runner error</b>\n<pre>${esc(error?.message || String(error))}</pre>`);
  }

  async _send(text) {
    const token  = this.opts.botToken || process.env.TG_BOT_TOKEN;
    const chatId = this.opts.chatId   || process.env.TG_CHAT_LOGS_ID;
    if (!token || !chatId) {
      console.error('[telegram-notifier] Missing TG_BOT_TOKEN or TG_CHAT_LOGS_ID');
      return;
    }
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true })
      });
      if (!res.ok) console.error('[telegram-notifier] Telegram HTTP', res.status, await res.text());
    } catch (e) {
      console.error('[telegram-notifier] Send failed:', e);
    }
  }
}
