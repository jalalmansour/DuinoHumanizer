/**
 * rotary_browser.js
 * Rotary Stealth Browser Manager for Paraphraser & Duino Deep Researcher.
 * Fully developed in JavaScript for Node.js using playwright-core.
 * Architected by J.D | Duino Inc. All rights are preserved.
 *
 * Features:
 * - Rotary User-Agent pool (Modern Windows, macOS, Linux desktop browsers)
 * - Viewport randomization
 * - Anti-detection stealth scripts (navigator.webdriver bypass, Chrome runtime emulation)
 * - Visual awareness: Autoscrolls elements into view before capturing screenshots
 * - Bulletproof screenshot engine (CDP raster capture fallback to prevent webfont timeouts)
 * - 0 API Keys required (100% Free browser automation)
 */

const fs = require('fs');
const path = require('path');

let rotaryMod = null;
try {
  rotaryMod = require('../../lib/rotary_user_agents.js');
} catch (_) {}

const ROTARY_USER_AGENTS = (rotaryMod && rotaryMod.USER_AGENTS)
  ? rotaryMod.USER_AGENTS.map(u => u.ua)
  : [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    ];

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 }
];

function findChromiumExecutable() {
  const custom = process.env.CHROMIUM_PATH || process.env.PLAYWRIGHT_CHROME_EXECUTABLE;
  if (custom && fs.existsSync(custom)) return custom;

  const candidates = [
    'C:\\Users\\jalal\\AppData\\Local\\ms-playwright\\chromium-1179\\chrome-win\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return undefined;
}

class RotaryBrowser {
  constructor(options = {}) {
    this.headless = options.headless !== false;
    this.proxy = options.proxy || process.env.ROTARY_PROXY || process.env.HTTP_PROXY || null;
    this.browser = null;
    this.context = null;
    this.pw = null;
  }

  async start() {
    let pwCore;
    try {
      pwCore = require('playwright-core');
    } catch (_) {
      try {
        pwCore = require('playwright');
      } catch (err) {
        throw new Error('Playwright is not installed. Run `npm install playwright-core` to enable browser automation.');
      }
    }
    this.pw = pwCore;

    const launchArgs = [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list'
    ];

    const launchOpts = {
      headless: this.headless,
      args: launchArgs
    };

    const exe = findChromiumExecutable();
    if (exe) {
      launchOpts.executablePath = exe;
    }

    if (this.proxy) {
      launchOpts.proxy = { server: this.proxy };
    }

    this.browser = await this.pw.chromium.launch(launchOpts);
    return this.browser;
  }

  async newPage() {
    if (!this.browser) {
      await this.start();
    }

    const ua = ROTARY_USER_AGENTS[Math.floor(Math.random() * ROTARY_USER_AGENTS.length)];
    const vp = VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];

    this.context = await this.browser.newContext({
      userAgent: ua,
      viewport: vp,
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['clipboard-read', 'clipboard-write']
    });

    const page = await this.context.newPage();

    // Inject stealth scripts to mask automation and headless fingerprints
    await page.addInitScript(`
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(param) {
        if (param === 37445) return 'Intel Inc.';
        if (param === 37446) return 'Intel(R) Iris(R) Xe Graphics';
        return getParameter.apply(this, arguments);
      };
    `);

    // Route: abort webfonts to prevent font loading timeouts
    await page.route('**/*.{woff,woff2,ttf,otf}', route => route.abort());

    return page;
  }

  async resetSession(page) {
    try {
      if (this.context) await this.context.clearCookies();
      if (page) {
        await page.evaluate(() => {
          try { localStorage.clear(); } catch (_) {}
          try { sessionStorage.clear(); } catch (_) {}
        });
      }
    } catch (_) {}
  }

  static async autoscrollToElement(page, selector, block = 'center') {
    try {
      const loc = page.locator(selector).first();
      if ((await loc.count()) > 0) {
        await loc.scrollIntoViewIfNeeded({ timeout: 4000 });
        await page.waitForTimeout(500);
        return true;
      }
    } catch (_) {}

    try {
      await page.evaluate(({ sel, blk }) => {
        const el = document.querySelector(sel);
        if (el) el.scrollIntoView({ behavior: 'instant', block: blk });
      }, { sel: selector, blk: block });
      await page.waitForTimeout(500);
      return true;
    } catch (_) {
      return false;
    }
  }

  static async captureScreenshot(page, outputPath, selector = null) {
    fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });

    if (selector) {
      await this.autoscrollToElement(page, selector);
    }

    // Attempt 1: Standard Playwright screenshot
    try {
      await page.screenshot({ path: outputPath, timeout: 5000, animations: 'disabled' });
      return outputPath;
    } catch (_) {}

    // Attempt 2: CDP direct raster capture fallback
    try {
      const cdp = await page.context().newCDPSession(page);
      const res = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const data = Buffer.from(res.data, 'base64');
      fs.writeFileSync(outputPath, data);
      return outputPath;
    } catch (err) {
      return '';
    }
  }

  async close() {
    if (this.context) {
      try { await this.context.close(); } catch (_) {}
    }
    if (this.browser) {
      try { await this.browser.close(); } catch (_) {}
    }
  }
}

module.exports = { RotaryBrowser, ROTARY_USER_AGENTS, VIEWPORTS };
