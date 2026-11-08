/**
 * superhumanizer.js
 * High-Precision Humanization Engine for SuperHumanizer.ai.
 * Dual-Mode: Direct Live HTTP API + Playwright Stealth Browser Automation.
 * Fully developed in JavaScript for Node.js and Serverless Environments.
 * Architected by J.D | Duino Inc. All rights are preserved.
 *
 * - 0 API keys required (100% Free live integration)
 * - Natively calls https://superhumanizer.ai/api/humanize
 * - Supports Mode selection ('Super Ultra' or 'Super Lite') and Tone ('Academic', 'General', etc.)
 * - Automatic <30-word contextual framing to satisfy API contract
 * - Playwright stealth browser with rotary User-Agents and full screenshot evidence
 * - Deterministic adversarial NLP mutation fallback if network completely offline
 */

const fs = require('fs');
const path = require('path');
const { RotaryBrowser } = require('./rotary_browser.js');

const SUPERHUMANIZER_URL = 'https://superhumanizer.ai/';
const SUPERHUMANIZER_API_URL = 'https://superhumanizer.ai/api/humanize';

// Base Adversarial Rules for Local NLP Fallback (Only used if external service is completely unreachable)
const BASE_AI_MUTATIONS = [
  [/\bIn the contemporary landscape of\b/gi, "In current practice,"],
  [/\bIn today's fast-paced digital age\b/gi, "Currently,"],
  [/\bIn today's digital age\b/gi, "In contemporary settings,"],
  [/\bIn an era characterized by\b/gi, "As"],
  [/\bdelve into\b/gi, "examine"],
  [/\bdelves into\b/gi, "examines"],
  [/\bdelving into\b/gi, "examining"],
  [/\bcrucial role\b/gi, "pivotal function"],
  [/\bplays? a (?:pivotal|crucial|vital|central) role in\b/gi, "is central to"],
  [/\bplays? an (?:instrumental|indispensable) role in\b/gi, "actively drives"],
  [/\bserves as a testament to\b/gi, "attests to"],
  [/\bis a testament to\b/gi, "demonstrates"],
  [/\btapestry of\b/gi, "complex array of"],
  [/\bvibrant tapestry\b/gi, "rich synthesis"],
  [/\brich tapestry\b/gi, "broad spectrum"],
  [/\bin conclusion\b/gi, "ultimately"],
  [/\bfurthermore\b/gi, "moreover"],
  [/\bmoreover\b/gi, "in parallel"],
  [/\bit is important to note that\b/gi, "notably,"],
  [/\bit is crucial to recognize that\b/gi, "importantly,"],
  [/\bit is worth noting that\b/gi, "specifically,"],
  [/\bpivotal\b/gi, "central"],
  [/\butilize\b/gi, "use"],
  [/\butilizes\b/gi, "uses"],
  [/\butilizing\b/gi, "employing"],
  [/\butilization\b/gi, "application"],
  [/\bmultifaceted\b/gi, "varied"],
  [/\bfostering\b/gi, "cultivating"],
  [/\bbeacon of\b/gi, "touchstone for"],
  [/\brevolutionize\b/gi, "reframe"],
  [/\bintertwined\b/gi, "linked"],
  [/\bparadigm shift\b/gi, "methodological transition"],
  [/\bharnessing the power of\b/gi, "leveraging"],
  [/\bharness the power of\b/gi, "apply"],
  [/\bin the realm of\b/gi, "within"],
  [/\bunderscores the importance of\b/gi, "highlights"],
  [/\bunderscores\b/gi, "emphasizes"],
  [/\bintricate\b/gi, "detailed"],
  [/\bseamless\b/gi, "fluid"],
  [/\bseamlessly\b/gi, "smoothly"],
  [/\btestament\b/gi, "evidence"]
];

class SuperHumanizer {
  constructor(options = {}) {
    this.headless = options.headless !== false;
    this.proxy = options.proxy || null;
  }

  /**
   * Executes a direct, high-precision live humanization request against https://superhumanizer.ai/api/humanize.
   * Zero browser overhead, works seamlessly on Vercel Serverless, Node.js, and local environments.
   */
  async humanizeViaApi(text, options = {}) {
    const raw = (text || '').trim();
    if (!raw) {
      return { humanized_text: '', success: false, error: 'Empty text' };
    }

    const mode = options.mode || 'Super Ultra';
    const tone = options.tone || 'Academic';
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '_').slice(0, 15);

    // SuperHumanizer API requires at least 30 words
    const words = raw.split(/\s+/).filter(Boolean);
    let sendText = raw;
    let isPadded = false;

    if (words.length < 30) {
      isPadded = true;
      const paddingPrefix = "In evaluating this foundational observation regarding system concepts and contextual understanding across contemporary research methodologies, ";
      sendText = paddingPrefix + raw;
    }

    console.log(`[SuperHumanizer] Calling live API against ${SUPERHUMANIZER_API_URL} (Mode: ${mode}, Tone: ${tone})...`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    try {
      const res = await fetch(SUPERHUMANIZER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Origin': 'https://superhumanizer.ai',
          'Referer': 'https://superhumanizer.ai/'
        },
        body: JSON.stringify({
          text: sendText,
          mode: mode,
          tone: tone,
          preserveHeadings: options.preserveHeadings !== false,
          usePremiumEngine: false
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(`SuperHumanizer HTTP ${res.status}: ${errBody.error || res.statusText}`);
      }

      const data = await res.json();
      let humanized = (data && data.humanizedText) ? data.humanizedText.trim() : '';

      if (isPadded && humanized) {
        const padIdx = humanized.indexOf(',');
        if (padIdx !== -1 && padIdx < 160) {
          humanized = humanized.slice(padIdx + 1).trim();
          humanized = humanized.charAt(0).toUpperCase() + humanized.slice(1);
        }
      }

      if (!humanized) {
        throw new Error('SuperHumanizer returned empty output payload');
      }

      console.log(`[SuperHumanizer Live] Successfully received ${humanized.length} chars of real humanized text.`);
      return {
        humanized_text: humanized,
        mode: mode,
        success: true,
        original_length: raw.length,
        humanized_length: humanized.length,
        screenshot: '',
        timestamp: timestamp,
        source: 'SuperHumanizer Live API'
      };
    } catch (err) {
      clearTimeout(timeout);
      console.warn(`[SuperHumanizer Live API Notice] ${err.message}`);
      throw err;
    }
  }

  /**
   * Submits text to SuperHumanizer.ai and returns humanized text.
   * Auto-selects live API for high speed and resilience; uses Playwright browser when available/requested.
   */
  async humanize(text, options = {}) {
    const raw = (text || '').trim();
    if (!raw) {
      return { humanized_text: '', success: false, error: 'Empty text' };
    }

    const mode = options.mode || 'Super Ultra';
    const screenshotsDir = options.screenshots_dir || path.join(process.cwd(), 'screenshots');
    const timeoutSeconds = options.timeout_seconds || 35;
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '_').slice(0, 15);
    const shotPath = path.join(screenshotsDir, `superhumanizer_${timestamp}.png`);

    const result = {
      humanized_text: '',
      mode: mode,
      success: false,
      original_length: raw.length,
      humanized_length: 0,
      screenshot: '',
      timestamp: timestamp,
      source: 'SuperHumanizer Playwright Browser'
    };

    const preferBrowser = options.use_browser === true || (
      process.env.USE_PLAYWRIGHT === '1' &&
      options.use_api !== true
    );

    // If browser is not explicitly forced, run the real Live API first
    if (!preferBrowser) {
      try {
        return await this.humanizeViaApi(raw, options);
      } catch (apiErr) {
        console.warn(`[SuperHumanizer] Live API attempt failed: ${apiErr.message}. Attempting browser fallback...`);
      }
    }

    // Try automated browser
    let rb = null;
    try {
      rb = new RotaryBrowser({ headless: this.headless, proxy: this.proxy });
      const page = await rb.newPage();

      const capturedFromApi = [];
      page.on('response', async (res) => {
        try {
          if (res.url().includes('/api/humanize') && res.status() === 200) {
            const data = await res.json();
            if (data && data.humanizedText) {
              capturedFromApi.push(data.humanizedText);
            }
          }
        } catch (_) {}
      });

      console.log(`[SuperHumanizer] Navigating to ${SUPERHUMANIZER_URL}...`);
      try {
        await page.goto(SUPERHUMANIZER_URL, { timeout: 35000, waitUntil: 'domcontentloaded' });
      } catch (_) {
        await page.waitForTimeout(1500);
        await page.goto(SUPERHUMANIZER_URL, { timeout: 35000, waitUntil: 'domcontentloaded' });
      }

      await page.waitForTimeout(2500);

      // Select mode button if present
      if (mode) {
        try {
          const modeBtn = page.locator(`button:has-text('${mode}')`).first();
          if (await modeBtn.isVisible()) {
            await modeBtn.click();
            await page.waitForTimeout(400);
          }
        } catch (_) {}
      }

      // Enter text into textarea safely (bypassing overlay buttons)
      await page.evaluate((txt) => {
        const ta = document.querySelector('textarea');
        if (ta) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          if (setter) setter.call(ta, txt);
          else ta.value = txt;
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          ta.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, raw);
      await page.waitForTimeout(800);

      // Locate and click Humanize button
      const humanizeBtn = page.locator("button:has-text('Humanize')").first();
      try { await humanizeBtn.scrollIntoViewIfNeeded({ timeout: 3000 }); } catch (_) {}
      await page.waitForTimeout(400);

      try {
        await humanizeBtn.click({ force: true, timeout: 5000 });
      } catch (_) {
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const b = btns.find(x => x.textContent.trim().toLowerCase().includes('humanize'));
          if (b) b.click();
        });
      }

      console.log("[SuperHumanizer] Clicked 'Humanize', awaiting output...");

      // Poll for response
      const startWait = Date.now();
      let extractedText = '';

      while (Date.now() - startWait < timeoutSeconds * 1000) {
        await page.waitForTimeout(1000);

        if (capturedFromApi.length > 0) {
          extractedText = capturedFromApi[capturedFromApi.length - 1];
          break;
        }

        try {
          const tas = await page.locator('textarea').all();
          if (tas.length > 1) {
            const val = (await tas[1].inputValue()).trim();
            if (val && val.length > 15 && val !== raw) {
              extractedText = val;
              break;
            }
          }
        } catch (_) {}

        try {
          const copyBtn = page.locator("button:has-text('Copy')").first();
          if (await copyBtn.isVisible()) {
            await page.waitForTimeout(1000);
            if (capturedFromApi.length > 0) {
              extractedText = capturedFromApi[capturedFromApi.length - 1];
              break;
            }
          }
        } catch (_) {}
      }

      if (extractedText) {
        result.humanized_text = extractedText;
        result.humanized_length = extractedText.length;
        result.success = true;
      }

      // Visual awareness capture
      try {
        await RotaryBrowser.autoscrollToElement(page, "button:has-text('Copy'), textarea");
        await page.waitForTimeout(600);
        const savedShot = await RotaryBrowser.captureScreenshot(page, shotPath, "button:has-text('Copy'), textarea");
        result.screenshot = savedShot;
      } catch (_) {}

      await rb.close();
      if (result.success) return result;
    } catch (browserErr) {
      if (rb) {
        try { await rb.close(); } catch (_) {}
      }
      console.log(`[SuperHumanizer Browser Notice] ${browserErr.message} - Falling back to SuperHumanizer Live API.`);
    }

    // Secondary fallback: Direct Live API
    try {
      return await this.humanizeViaApi(raw, options);
    } catch (e2) {
      console.warn(`[SuperHumanizer Notice] Direct API also encountered: ${e2.message}. Applying local NLP rules.`);
    }

    // Local Adversarial NLP Humanization Fallback (Only reached if network completely offline)
    let fallbackText = raw;
    BASE_AI_MUTATIONS.forEach(([pat, rep]) => {
      fallbackText = fallbackText.replace(pat, rep);
    });

    const sentences = fallbackText.split(/(?<=[.!?])\s+/);
    const mutated = sentences.map((s, idx) => {
      let trimmed = s.trim();
      if (mode.includes('Ultra') && idx % 3 === 0 && trimmed.includes(', which ')) {
        trimmed = trimmed.replace(', which ', '. This dynamic ');
      }
      return trimmed;
    });

    fallbackText = mutated.join(' ').replace(/\s+/g, ' ').replace(/\s+([.,!?;:])/g, '$1');

    result.humanized_text = fallbackText;
    result.humanized_length = fallbackText.length;
    result.success = true;
    result.source = 'Local NLP Adversarial Engine (Offline)';
    return result;
  }
}

module.exports = { SuperHumanizer, BASE_AI_MUTATIONS, SUPERHUMANIZER_URL, SUPERHUMANIZER_API_URL };
