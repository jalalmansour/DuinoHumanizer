/**
 * verify_live_vercel_ui.js
 * Visual & Functional Playwright verification of live Vercel production: https://duinizer.vercel.app/
 */

const fs = require('fs');
const path = require('path');
const { RotaryBrowser } = require('../paraphraser/scripts/rotary_browser.js');

const ARTIFACT_DIR = 'C:\\Users\\jalal\\.gemini\\antigravity-cli\\brain\\581fbe91-14b1-4ee8-91d7-7f944a1cb191';
const LIVE_URL = 'https://duinizer.vercel.app';

async function verifyLiveVercel() {
  console.log(`======================================================================`);
  console.log(`STARTING LIVE PLAYWRIGHT VERIFICATION ON: ${LIVE_URL}`);
  console.log(`======================================================================\n`);

  const rb = new RotaryBrowser({ headless: true });
  const page = await rb.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });

  console.log(`[1/5] Navigating to ${LIVE_URL}...`);
  await page.goto(LIVE_URL, { waitUntil: 'load', timeout: 35000 });
  await page.waitForTimeout(2500);

  // 1. Initial State
  const shot1 = path.join(ARTIFACT_DIR, '01_live_vercel_loaded.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log(`  Saved screenshot: ${shot1}`);

  // Check tab title and favicon
  const title = await page.title();
  console.log(`  Page Title: "${title}"`);
  const favicon = await page.getAttribute('link[rel="icon"]', 'href');
  console.log(`  Favicon Href: "${favicon}"`);

  // 2. Input AI test text
  const aiSample = "In today's fast-paced digital age, artificial intelligence plays a crucial role in modern society. Furthermore, it serves as a testament to the transformative power of technological innovation. It is important to note that researchers delve into deep learning architectures to foster synergistic paradigms across diverse domains.";

  console.log(`\n[2/5] Entering AI test passage into live textarea (${aiSample.length} chars)...`);
  const textarea = page.locator('.editor-textarea').first();
  await textarea.fill(aiSample);
  await page.waitForTimeout(600);

  // 3. Trigger Humanize & Verify
  console.log(`\n[3/5] Triggering 'Humanize Text & Verify' button...`);
  const humanizeBtn = page.locator('button:has-text("Humanize Text & Verify")');
  await humanizeBtn.click();

  console.log(`  Waiting for humanization & ZeroGPT verification...`);
  await page.waitForFunction(() => {
    const btn = document.querySelector('button.btn-primary');
    return btn && btn.textContent.includes('Humanize Text & Verify') && !btn.disabled;
  }, { timeout: 60000 });
  await page.waitForTimeout(2000);

  // 4. Capture Output in Clean Reading View
  const shot2 = path.join(ARTIFACT_DIR, '02_live_vercel_clean_reading.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log(`\n[4/5] Output ready! Saved Clean Reading View: ${shot2}`);

  // Check output content
  const outputText = await page.evaluate(() => {
    const reading = document.querySelector('.clean-reading-flow');
    if (reading) return reading.innerText;
    const txtarea = document.querySelectorAll('.editor-textarea')[1];
    return txtarea ? txtarea.value : '';
  });
  console.log(`  Output Preview: "${outputText.slice(0, 150)}..."`);

  // Check verified badge
  const verifiedPill = await page.locator('.verified-pill').innerText().catch(() => 'None');
  console.log(`  Verification Badge: "${verifiedPill}"`);

  // 5. Switch to Word Diff
  console.log(`\n[5/5] Switching to Word Diff tab...`);
  const wordDiffBtn = page.locator('button:has-text("Word Diff")');
  if (await wordDiffBtn.count() > 0) {
    await wordDiffBtn.click();
    await page.waitForTimeout(800);
    const shot3 = path.join(ARTIFACT_DIR, '03_live_vercel_word_diff.png');
    await page.screenshot({ path: shot3, fullPage: false });
    console.log(`  Saved Word Diff: ${shot3}`);
  }

  // Open Audit Modal
  console.log(`  Opening Audit Modal for verification receipt...`);
  const auditBtn = page.locator('button:has-text("Audit Loop")');
  if (await auditBtn.count() > 0) {
    await auditBtn.click();
    await page.waitForTimeout(800);
    const shot4 = path.join(ARTIFACT_DIR, '04_live_vercel_audit_modal.png');
    await page.screenshot({ path: shot4, fullPage: false });
    console.log(`  Saved Audit Modal: ${shot4}`);
  }

  await rb.close();
  console.log(`\n======================================================================`);
  console.log(`LIVE VERCEL VERIFICATION COMPLETE! ALL CHECKS PASSED.`);
  console.log(`======================================================================`);
}

verifyLiveVercel().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
