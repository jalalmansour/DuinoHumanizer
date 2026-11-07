/**
 * superhumanizer.js
 * Playwright Browser Automation & Serverless Fallback Engine for SuperHumanizer.ai.
 * Fully developed in JavaScript for Node.js.
 * Architected by J.D | Duino Inc. All rights are preserved.
 *
 * - 0 API keys required (100% Free browser automation)
 * - Rotary User-Agent & stealth integration
 * - Human-like copy/paste clipboard interaction
 * - Mode selection: 'Super Lite' or 'Super Ultra'
 * - Network response interceptor for reliable text extraction
 * - Autoscroll to result container with screenshot evidence
 * - High-speed Serverless NLP fallback for cloud deployment
 */

const fs = require('fs');
const path = require('path');
const { RotaryBrowser } = require('./rotary_browser.js');

const SUPERHUMANIZER_URL = 'https://superhumanizer.ai/';

// Base Adversarial Rules for Serverless NLP Fallback
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
   * Submits text to SuperHumanizer.ai, autoscrolls, captures screenshot, and returns humanized text.
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
      timestamp: timestamp
    };

    // Try automated browser first
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

      // Enter text into textarea
      let pasted = false;
      try {
        await page.evaluate((txt) => navigator.clipboard.writeText(txt), raw);
        const pasteBtn = page.locator("button:has-text('Paste Text')").first();
        if (await pasteBtn.isVisible()) {
          await pasteBtn.click();
          await page.waitForTimeout(800);
          pasted = true;
          console.log('[SuperHumanizer] Human-like clipboard paste successful.');
        }
      } catch (_) {}

      if (!pasted) {
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
      }

      // Locate and click Humanize button
      const humanizeBtn = page.locator("button:has-text('Humanize')").first();
      try { await humanizeBtn.scrollIntoViewIfNeeded({ timeout: 3000 }); } catch (_) {}
      await page.waitForTimeout(400);

      try {
        await humanizeBtn.click({ force: true, timeout: 5000 });
      } catch (_) {
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const b = btns.find(x => x.textContent.trim().toLowerCase() === 'humanize');
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
      await RotaryBrowser.autoscrollToElement(page, "button:has-text('Copy'), textarea");
      await page.waitForTimeout(600);
      const savedShot = await RotaryBrowser.captureScreenshot(page, shotPath, "button:has-text('Copy'), textarea");
      result.screenshot = savedShot;

      await rb.close();
      if (result.success) return result;
    } catch (browserErr) {
      if (rb) {
        try { await rb.close(); } catch (_) {}
      }
      console.log(`[SuperHumanizer Browser Notice] ${browserErr.message} - Using high-speed NLP mutation engine.`);
    }

    // High-speed Serverless NLP Humanization Fallback
    let fallbackText = raw;
    BASE_AI_MUTATIONS.forEach(([pat, rep]) => {
      fallbackText = fallbackText.replace(pat, rep);
    });

    // Burstiness jitter
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
    return result;
  }
}

module.exports = { SuperHumanizer, BASE_AI_MUTATIONS };
