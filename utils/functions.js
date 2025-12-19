 import { SendLog } from './telegram.js';
 import 'dotenv/config';

 export async function CheckLogIn(page) {
      const DASHBOARD_PREFIX = 'https://hq1.appsflyer.com/unified-ltv/dashboard';

      
      await page.waitForURL(
        u => u.toString().startsWith(DASHBOARD_PREFIX),
        { timeout: 15000 }
      ).catch(() => { });

      if (page.url().startsWith(DASHBOARD_PREFIX)) {
       await SendLog(`<b>⚙️ Login successful</b>`);
      }
    }