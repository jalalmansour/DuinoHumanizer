/**
 * verify_unslop_ui_playwright.js
 * Visual verification of Unslop UI using RotaryBrowser.
 */

const fs = require('fs');
const path = require('path');
const { RotaryBrowser } = require('../paraphraser/scripts/rotary_browser.js');

const ARTIFACT_DIR = 'C:\\Users\\jalal\\.gemini\\antigravity-cli\\brain\\581fbe91-14b1-4ee8-91d7-7f944a1cb191';

async function runVisualVerification() {
  console.log('Launching RotaryBrowser for visual verification...');
  const rb = new RotaryBrowser({ headless: true });
  const page = await rb.newPage();

  // Set desktop viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[Browser Console Error] ${msg.text()}`);
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Initial State
  const shot1 = path.join(ARTIFACT_DIR, '01_unslop_studio_loaded.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log(`Saved screenshot 1: ${shot1}`);

  // 2. Insert AI Text into Source Textarea
  const sampleAiText = "In today's fast-paced digital age, artificial intelligence plays a crucial role in modern society. Furthermore, it serves as a testament to the transformative power of technological innovation. It is important to note that researchers delve into deep learning architectures to foster synergistic paradigms across diverse domains.";

  console.log('Entering text into source textarea...');
  const textarea = page.locator('.editor-textarea').first();
  await textarea.fill(sampleAiText);
  await page.waitForTimeout(500);

  // 3. Click Humanize & Verify
  console.log('Triggering Humanize & Verify button...');
  const humanizeBtn = page.locator('button:has-text("Humanize Text & Verify")');
  await humanizeBtn.click();

  // Wait for processing to complete
  console.log('Waiting for verification pass...');
  await page.waitForFunction(() => {
    const btn = document.querySelector('button.btn-primary');
    return btn && btn.textContent.includes('Humanize Text & Verify') && !btn.disabled;
  }, { timeout: 60000 });
  await page.waitForTimeout(1500);

  // 4. Capture Default Clean Reading View
  const shot2 = path.join(ARTIFACT_DIR, '02_unslop_reading_view.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log(`Saved screenshot 2 (Clean Reading View): ${shot2}`);

  // 5. Switch to Subtle Word Diff Mode
  console.log('Switching to Word Diff view...');
  const wordDiffBtn = page.locator('button:has-text("Word Diff")');
  if (await wordDiffBtn.count() > 0) {
    await wordDiffBtn.click();
    await page.waitForTimeout(800);
    const shot3 = path.join(ARTIFACT_DIR, '03_unslop_word_diff.png');
    await page.screenshot({ path: shot3, fullPage: false });
    console.log(`Saved screenshot 3 (Subtle Word Diff): ${shot3}`);
  }

  // 6. Open Audit Modal
  console.log('Opening Audit Modal...');
  const auditBtn = page.locator('button:has-text("Audit Loop")');
  if (await auditBtn.count() > 0) {
    await auditBtn.click();
    await page.waitForTimeout(800);
    const shot4 = path.join(ARTIFACT_DIR, '04_unslop_audit_modal.png');
    await page.screenshot({ path: shot4, fullPage: false });
    console.log(`Saved screenshot 4 (Audit Modal): ${shot4}`);

    const closeBtn = page.locator('button:has-text("Close")').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 7. Toggle Original Diff on Input
  console.log('Testing Original Diff toggle on Source panel...');
  const origDiffBtn = page.locator('button:has-text("Original Diff")');
  if (await origDiffBtn.count() > 0) {
    await origDiffBtn.click();
    await page.waitForTimeout(600);
    const shot5 = path.join(ARTIFACT_DIR, '05_unslop_original_diff.png');
    await page.screenshot({ path: shot5, fullPage: false });
    console.log(`Saved screenshot 5 (Original Diff): ${shot5}`);
  }

  await rb.close();
  console.log('Visual verification successfully completed!');
}

runVisualVerification().catch(err => {
  console.error('Visual verification failed:', err);
  process.exit(1);
});
